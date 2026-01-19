"""
Main Flask application for FinSight.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import API_HOST, API_PORT, DEBUG
from services import TransactionService, UploadService, PipelineService, RuleService
from utils import transactions_to_json


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)
    
    # Initialize services
    transaction_service = TransactionService()
    upload_service = UploadService()
    pipeline_service = PipelineService()
    rule_service = RuleService()
    
    @app.route('/rules', methods=['GET'])
    def get_rules():
        """Get all rules and metadata."""
        data = rule_service.get_data()
        return jsonify({
            'rules': [r.to_dict() for r in data['rules']],
            'last_reprocessed': data['metadata'].get('last_reprocessed')
        })

    @app.route('/rules', methods=['POST'])
    def add_rule():
        """Add a new rule."""
        data = request.json
        if not data or 'content' not in data:
            return jsonify({'error': 'Rule content is required'}), 400
            
        rule = rule_service.add_rule(
            data['content'], 
            data.get('type', 'both')
        )
        return jsonify(rule.to_dict()), 201
        
    @app.route('/rules/<rule_id>', methods=['PUT'])
    def update_rule(rule_id):
        """Update a rule."""
        data = request.json
        if not data or 'content' not in data:
             return jsonify({'error': 'Rule content is required'}), 400
             
        rule = rule_service.update_rule(
            rule_id, 
            data['content'],
            data.get('type', 'both')
        )
        
        if rule:
            return jsonify(rule.to_dict()), 200
        return jsonify({'error': 'Rule not found'}), 404

    @app.route('/rules/<rule_id>', methods=['DELETE'])
    def delete_rule(rule_id):
        """Delete a rule."""
        success = rule_service.delete_rule(rule_id)
        if success:
            return jsonify({'message': 'Rule deleted successfully'}), 200
        return jsonify({'error': 'Rule not found'}), 404

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
                # Trigger new pipeline processing
                print(f"File uploaded successfully. Triggering pipeline for {upload_type}...")
                pipeline_result = pipeline_service.run_pipeline(upload_type)
                
                if pipeline_result['success']:
                    return jsonify({
                        'message': message,
                        'pipeline_status': 'success',
                        **data
                    })
                else:
                    return jsonify({
                        'message': message,
                        'pipeline_status': 'failed',
                        'error': pipeline_result.get('error'),
                        **data
                    }), 206 # Partial success
            else:
                return jsonify({'error': message}), 400
                
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
        return jsonify({'status': 'healthy', 'service': 'FinSight API'})
    
    @app.route('/upload/<upload_type>', methods=['POST'])
    def upload_file(upload_type):
        """
        Upload a CSV file.
        upload_type: 'credit' or 'debit'
        """
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        
        # Use the new pipeline for processing?
        # For now, let's stick to the old upload_service for saving the file,
        # but trigger the new pipeline for processing.
        
        success, message, data = upload_service.upload_file(file, upload_type)
        
        if success:
            # Trigger new pipeline
            print(f"File uploaded successfully. Triggering pipeline for {upload_type}...")
            pipeline_result = pipeline_service.run_pipeline(upload_type)
            
            if pipeline_result['success']:
                return jsonify({'message': message, 'data': data, 'pipeline_status': 'success'}), 200
            else:
                return jsonify({'message': message, 'data': data, 'pipeline_status': 'failed', 'error': pipeline_result.get('error')}), 206
        else:
            return jsonify({'error': message}), 400

    @app.route('/files/<upload_type>', methods=['GET'])
    def list_files(upload_type):
        """List uploaded files."""
        result = upload_service.list_uploaded_files(upload_type)
        if 'error' in result:
            return jsonify(result), 400
        return jsonify(result)

    @app.route('/files/<upload_type>/<filename>', methods=['DELETE'])
    def delete_file(upload_type, filename):
        """Delete an uploaded file."""
        success, message = upload_service.delete_uploaded_file(upload_type, filename)
        if success:
            # Trigger new pipeline to reflect deletion
            print(f"File deleted successfully. Triggering pipeline for {upload_type}...")
            pipeline_result = pipeline_service.run_pipeline(upload_type)
            
            if pipeline_result['success']:
                return jsonify({'message': message, 'pipeline_status': 'success'}), 200
            else:
                return jsonify({'message': message, 'pipeline_status': 'failed', 'error': pipeline_result.get('error')}), 206
        else:
            return jsonify({'error': message}), 400

    @app.route('/reprocess/<upload_type>', methods=['POST'])
    def reprocess_files(upload_type):
        """Reprocess all files of a given type."""
        # Use the NEW PipelineService
        print(f"Reprocessing {upload_type} using new PipelineService...")
        result = pipeline_service.run_pipeline(upload_type)
        
        if result['success']:
            return jsonify({'message': f"Successfully reprocessed {upload_type} transactions", 'details': result['results']}), 200
        else:
            return jsonify({'error': result['error']}), 500
    
    @app.route('/transactions', methods=['GET'])
    def get_transactions():
        """Get all transactions."""
        transactions = transaction_service.get_all_transactions()
        # Convert to dict
        return jsonify({'transactions': [t.to_dict() for t in transactions]})
    
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
            data = request.json
            if not data or 'category' not in data:
                return jsonify({'error': 'Category name is required'}), 400
            
            category_name = data['category'].strip()
            if not category_name:
                return jsonify({'error': 'Category name cannot be empty'}), 400
                
            success = transaction_service.add_category(category_name)
            if success:
                return jsonify({'message': f'Category "{category_name}" added successfully'}), 201
            else:
                return jsonify({'error': f'Category "{category_name}" already exists'}), 400
                
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500

    @app.route('/categories/<category>', methods=['DELETE'])
    def delete_category(category):
        """Delete a category."""
        try:
            success = transaction_service.delete_category(category)
            if success:
                return jsonify({'message': f'Category "{category}" deleted successfully'}), 200
            else:
                return jsonify({'error': f'Category "{category}" not found'}), 404
                
        except Exception as e:
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    @app.route('/stats', methods=['GET'])
    def get_stats():
        """Get transaction statistics."""
        stats = transaction_service.get_transaction_stats()
        return jsonify(stats)
    
    @app.route('/transactions/<transaction_id>', methods=['PATCH'])
    def update_transaction(transaction_id):
        """Update a transaction."""
        try:
            updates = request.json
            if not updates:
                return jsonify({'error': 'No updates provided'}), 400
                
            # Try using the new pipeline service for updates first (if it supports it)
            # Currently pipeline_service.update_transaction is experimental.
            # Let's stick to transaction_service for now as it modifies the CSVs directly,
            # which is compatible with the new pipeline's "Overrides" if we sync them.
            
            # WAIT! The new pipeline overwrites the CSVs from Silver + Overrides.
            # If we update the CSV directly using transaction_service, those changes are LOST
            # on the next pipeline run unless we ALSO update the Overrides.
            
            # So we MUST use the pipeline_service to update transactions if we are switching to it.
            
            success = pipeline_service.update_transaction(transaction_id, updates)
            
            if not success:
                # Fallback to old method if new one fails (e.g. ID not found)
                print("Pipeline update failed, falling back to direct CSV update...")
                success = transaction_service.update_transaction(transaction_id, updates)
            
            if success:
                return jsonify({'message': 'Transaction updated successfully'}), 200
            else:
                return jsonify({'error': 'Transaction not found or update failed'}), 404
                
        except Exception as e:
            print(f"Error updating transaction: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/transactions/bulk-update', methods=['POST'])
    def bulk_update_transactions():
        """Bulk update transactions."""
        try:
            updates = request.json
            print(f"Updates: {updates}")
            
            # Handle wrapped updates (frontend sends { updates: [...] })
            if isinstance(updates, dict) and 'updates' in updates:
                updates = updates['updates']
            
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
            
            # Use pipeline_service for bulk updates
            success_count = pipeline_service.bulk_update_transactions(validated_updates)
            
            if success_count > 0:
                return jsonify({'message': f'{success_count} transactions updated successfully'}), 200
            else:
                # Fallback
                success = transaction_service.bulk_update_transactions(updates)
                if success:
                    return jsonify({'message': 'Transactions updated successfully'}), 200
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
