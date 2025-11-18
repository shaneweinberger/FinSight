"""
Main Flask application for FinSight.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import API_HOST, API_PORT, DEBUG
from services import TransactionService, UploadService
from utils import transactions_to_json


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)
    
    # Initialize services
    transaction_service = TransactionService()
    upload_service = UploadService()
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        return jsonify({'status': 'healthy', 'message': 'FinSight API is running'})
    
    @app.route('/upload-csv', methods=['POST'])
    def upload_csv():
        """Handle CSV file uploads and trigger ETL processing."""
        try:
            # Get file and upload type from request
            if 'file' not in request.files:
                return jsonify({'error': 'No file provided'}), 400
            
            file = request.files['file']
            upload_type = request.form.get('type')
            
            if not upload_type:
                return jsonify({'error': 'Upload type is required'}), 400
            
            # Upload and process file
            success, message, data = upload_service.upload_file(file, upload_type)
            
            if success:
                return jsonify({
                    'message': message,
                    **data
                })
            else:
                return jsonify({'error': message}), 400
                
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @app.route('/uploaded-files/<upload_type>', methods=['GET'])
    def list_uploaded_files(upload_type):
        """List all uploaded files for a given type."""
        try:
            result = upload_service.list_uploaded_files(upload_type)
            if 'error' in result:
                return jsonify(result), 400
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @app.route('/uploaded-files/<upload_type>/<filename>', methods=['DELETE'])
    def delete_uploaded_file(upload_type, filename):
        """Delete an uploaded file."""
        try:
            success, message = upload_service.delete_uploaded_file(upload_type, filename)
            if success:
                return jsonify({'message': message})
            else:
                return jsonify({'error': message}), 400
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @app.route('/reprocess/<upload_type>', methods=['POST'])
    def reprocess_files(upload_type):
        """Re-process all uploaded files for a given type."""
        try:
            success, message = upload_service.reprocess_all_files(upload_type)
            if success:
                return jsonify({'message': message})
            else:
                return jsonify({'error': message}), 400
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @app.route('/transactions', methods=['GET'])
    def get_transactions():
        """Get all transactions."""
        try:
            transactions = transaction_service.get_all_transactions()
            transactions_json = transactions_to_json(transactions)
            
            return jsonify({'transactions': transactions_json})
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @app.route('/categories', methods=['GET'])
    def get_categories():
        """Get all available categories."""
        try:
            categories = transaction_service.get_categories()
            return jsonify(categories)
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500

    @app.route('/categories', methods=['POST'])
    def add_category():
        """Add a new category."""
        try:
            data = request.get_json()
            if not data or 'category' not in data:
                return jsonify({'error': 'Category name is required'}), 400
            
            category = data['category']
            if not category or not isinstance(category, str):
                return jsonify({'error': 'Invalid category name'}), 400
            
            success = transaction_service.add_category(category)
            if success:
                return jsonify({'message': f'Category {category} added successfully'})
            else:
                return jsonify({'error': 'Category already exists or failed to add'}), 400
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500

    @app.route('/categories/<category>', methods=['DELETE'])
    def delete_category(category):
        """Delete a category."""
        try:
            success = transaction_service.delete_category(category)
            if success:
                return jsonify({'message': f'Category {category} deleted successfully'})
            else:
                return jsonify({'error': 'Category not found or failed to delete'}), 404
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @app.route('/stats', methods=['GET'])
    def get_stats():
        """Get transaction statistics."""
        try:
            stats = transaction_service.get_transaction_stats()
            return jsonify(stats)
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @app.route('/transactions/<transaction_id>', methods=['PUT'])
    def update_transaction(transaction_id):
        """Update a single transaction."""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Validate required fields (handle both lowercase and capitalized)
            allowed_fields = ['category', 'description', 'Category', 'Description']
            updates = {k: v for k, v in data.items() if k in allowed_fields}
            
            if not updates:
                return jsonify({'error': 'No valid fields to update'}), 400
            
            success = transaction_service.update_transaction(transaction_id, updates)
            
            if success:
                return jsonify({'message': 'Transaction updated successfully'})
            else:
                return jsonify({'error': 'Failed to update transaction'}), 500
                
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @app.route('/transactions/bulk-update', methods=['POST'])
    def bulk_update_transactions():
        """Update multiple transactions."""
        try:
            data = request.get_json()
            print(f"Received data: {data}")
            
            if not data or 'updates' not in data:
                return jsonify({'error': 'No updates provided'}), 400
            
            updates = data['updates']
            print(f"Updates: {updates}")
            
            if not isinstance(updates, list):
                return jsonify({'error': 'Updates must be a list'}), 400
            
            # Validate each update
            validated_updates = []
            for update in updates:
                print(f"Processing update: {update}")
                if 'id' not in update or 'updates' not in update:
                    print(f"Skipping update - missing id or updates: {update}")
                    continue
                
                # Filter allowed fields (handle both lowercase and capitalized)
                allowed_fields = ['category', 'description', 'Category', 'Description']
                filtered_updates = {k: v for k, v in update['updates'].items() if k in allowed_fields}
                print(f"Filtered updates: {filtered_updates}")
                
                if filtered_updates:
                    validated_update = {
                        'id': update['id'],
                        'updates': filtered_updates
                    }
                    # Also include transactionData if present (needed for content matching)
                    if 'transactionData' in update:
                        validated_update['transactionData'] = update['transactionData']
                    validated_updates.append(validated_update)
            
            print(f"Validated updates: {validated_updates}")
            
            if not validated_updates:
                return jsonify({'error': 'No valid updates provided'}), 400
            
            success = transaction_service.bulk_update_transactions(validated_updates)
            
            if success:
                return jsonify({'message': f'Updated {len(validated_updates)} transactions successfully'})
            else:
                return jsonify({'error': 'Failed to update transactions'}), 500
                
        except Exception as e:
            print(f"Error in bulk_update_transactions: {e}")
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    return app


def main():
    """Run the Flask application."""
    app = create_app()
    app.run(host=API_HOST, port=API_PORT, debug=DEBUG)


if __name__ == '__main__':
    main()
