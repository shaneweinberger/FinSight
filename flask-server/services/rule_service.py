"""
Service for managing user-defined rules.
"""
from typing import List, Optional
import json
from pathlib import Path
from config import GOLD_DIR
from models.rule import Rule

class RuleService:
    """Service for managing categorization rules."""
    
    def __init__(self):
        self.rules_file = GOLD_DIR / "rules.json"
        self._ensure_file_exists()
        
    def _ensure_file_exists(self):
        """Ensure rules file exists."""
        if not self.rules_file.exists():
            self._save_data([], {'last_reprocessed': None})
            
    def _save_data(self, rules: List[Rule], metadata: dict):
        """Save rules and metadata to file."""
        data = {
            'rules': [r.to_dict() for r in rules],
            'metadata': metadata
        }
        with open(self.rules_file, 'w') as f:
            json.dump(data, f, indent=2)
            
    def get_data(self):
        """Get all rules and metadata."""
        if not self.rules_file.exists():
            return {'rules': [], 'metadata': {}}
            
        try:
            with open(self.rules_file, 'r') as f:
                data = json.load(f)
                rules = [Rule.from_dict(r) for r in data.get('rules', [])]
                metadata = data.get('metadata', {})
                return {'rules': rules, 'metadata': metadata}
        except Exception as e:
            print(f"Error loading rules: {e}")
            return {'rules': [], 'metadata': {}}
            
    def get_rules(self) -> List[Rule]:
        """Get all rules."""
        return self.get_data()['rules']

    def get_last_reprocessed(self) -> Optional[str]:
        """Get last reprocessed timestamp."""
        return self.get_data()['metadata'].get('last_reprocessed')
        
    def set_last_reprocessed(self):
        """Set last reprocessed timestamp to now."""
        from datetime import datetime
        data = self.get_data()
        data['metadata']['last_reprocessed'] = datetime.now().isoformat()
        self._save_data(data['rules'], data['metadata'])
            
    def add_rule(self, content: str, rule_type: str = 'both') -> Rule:
        """Add a new rule."""
        data = self.get_data()
        new_rule = Rule(content=content, rule_type=rule_type)
        data['rules'].append(new_rule)
        self._save_data(data['rules'], data['metadata'])
        return new_rule
        
    def delete_rule(self, rule_id: str) -> bool:
        """Delete a rule by ID."""
        data = self.get_data()
        rules = data['rules']
        initial_len = len(rules)
        rules = [r for r in rules if r.rule_id != rule_id]
        
        if len(rules) < initial_len:
            self._save_data(rules, data['metadata'])
            return True
        return False
        
    def update_rule(self, rule_id: str, content: str, rule_type: str) -> Optional[Rule]:
        """Update a rule."""
        data = self.get_data()
        rules = data['rules']
        for rule in rules:
            if rule.rule_id == rule_id:
                rule.content = content
                rule.rule_type = rule_type
                self._save_data(rules, data['metadata'])
                return rule
        return None
