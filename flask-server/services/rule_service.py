"""
Service for managing user-defined rules via Supabase.
"""
from typing import List, Optional
from flask import g
from services.supabase_service import SupabaseService
from models.rule import Rule

class RuleService:
    """Service for managing categorization rules via Supabase."""
    
    def __init__(self):
        pass
    
    def get_client(self):
        if 'token' not in g:
            raise Exception("No authenticated user found")
        return SupabaseService.get_auth_client(g.token)
        
    def get_data(self):
        """Get all rules and metadata (metadata is just legacy now)."""
        try:
            client = self.get_client()
            response = client.table('rules').select('*').execute()
            rules = [Rule.from_dict(r) for r in response.data]
            
            # Supabase doesn't easily store random metadata.
            # We will ignore 'last_reprocessed' for now or store it in a dedicated 'settings' table if needed.
            # For this simple port, let's just return empty metadata.
            return {'rules': rules, 'metadata': {}}
            
        except Exception as e:
            print(f"Error loading rules: {e}")
            return {'rules': [], 'metadata': {}}
            
    def get_rules(self) -> List[Rule]:
        """Get all rules."""
        return self.get_data()['rules']

    def get_last_reprocessed(self) -> Optional[str]:
        """Get last reprocessed timestamp. (Not implemented in DB yet)"""
        return None
        
    def set_last_reprocessed(self):
        """Set last reprocessed timestamp. (Not implemented in DB yet)"""
        pass
            
    def add_rule(self, content: str, rule_type: str = 'both') -> Rule:
        """Add a new rule."""
        try:
            client = self.get_client()
            response = client.table('rules').insert({
                'content': content, 
                'type': rule_type,
                'user_id': g.user.id
            }).execute()
            
            if response.data:
                return Rule.from_dict(response.data[0])
            raise Exception("Insert failed")
            
        except Exception as e:
            print(f"Error adding rule: {e}")
            raise e
        
    def delete_rule(self, rule_id: str) -> bool:
        """Delete a rule by ID."""
        try:
            client = self.get_client()
            # Supabase RLS ensures they can only delete their own
            client.table('rules').delete().eq('id', rule_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting rule: {e}")
            return False
        
    def update_rule(self, rule_id: str, content: str, rule_type: str) -> Optional[Rule]:
        """Update a rule."""
        try:
            client = self.get_client()
            response = client.table('rules').update({
                'content': content,
                'type': rule_type
            }).eq('id', rule_id).execute()
            
            if response.data:
                return Rule.from_dict(response.data[0])
            return None
        except Exception as e:
            print(f"Error updating rule: {e}")
            return None
