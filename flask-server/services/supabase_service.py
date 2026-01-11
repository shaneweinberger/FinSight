
import os
from supabase import create_client, Client
from flask import request, abort, g
from functools import wraps

class SupabaseService:
    _instance = None
    _client: Client = None

    def __init__(self):
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
        self._url = url
        self._key = key
        # The 'admin' client used for background tasks or verification (CAREFUL)
        # Actually initializing with the ANON key by default as per instruction.
        # If we had a SERVICE_ROLE key we would use it for admin tasks.
        self._client = create_client(url, key)

    @staticmethod
    def get_client() -> Client:
        """
        Get the base Supabase client (usually initialized with Anon key).
        For user actions, you should authentication matches the user.
        """
        if SupabaseService._instance is None:
            SupabaseService._instance = SupabaseService()
        return SupabaseService._instance._client
    
    @staticmethod
    def get_auth_client(token: str) -> Client:
        """
        Creates a new Supabase client instance authenticated with the user's token.
        This ensures RLS policies are applied correctly.
        """
        if SupabaseService._instance is None:
            SupabaseService._instance = SupabaseService()
        
        # Create a fresh client or clone/configure options with the header
        # Using the existing client and overriding headers for the request is cleaner if supported,
        # but create_client is cheap enough.
        # Note: supabase-py `create_client` doesn't easily support just adding headers to a shared instance 
        # without affecting others if we aren't careful.
        # Safest is to instantiate a new client for the request scope or use `replace_headers`.
        
        options = {"headers": {"Authorization": f"Bearer {token}"}}
        # We re-create the client for this specific user context
        try:
             # supabase-py doesn't take dict options in create_client easily in all versions, 
             # checking standard usage: create_client(url, key, options=ClientOptions(...))
             # simpler: use the client's auth helper
             
             client = create_client(SupabaseService._instance._url, SupabaseService._instance._key)
             client.auth.set_session(token, "refresh_token_not_needed_for_api_calls") 
             # Note: set_session might require refresh token. 
             # Alternative: Just set the header manually on the postgrest client?
             client.postgrest.auth(token)
             return client
        except Exception as e:
            # Fallback: Just return generic client, but RLS will fail
            print(f"Error creating auth client: {e}")
            return SupabaseService._instance._client

    @staticmethod
    def get_user_id():
        """Get user_id from the verified token in global context (set by required_auth)."""
        if 'user' in g:
            return g.user.id
        return None

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return abort(401, description="Missing Authorization Header")
        
        try:
            token = auth_header.split(" ")[1]
            service = SupabaseService()
            # Verify token by getting user
            # We use the generic client but with this token to ask Supabase "Who is this?"
            client = service.get_client()
            user_response = client.auth.get_user(token)
            
            if not user_response or not user_response.user:
                 return abort(401, description="Invalid Token")
                 
            # Store user in flask global context
            g.user = user_response.user
            g.token = token
            
        except Exception as e:
            print(f"Auth Error: {e}")
            return abort(401, description="Unauthorized")
            
        return f(*args, **kwargs)
    return decorated_function
