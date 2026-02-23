import hashlib
import secrets

# System Parameters
P = 4294967291  #A 32-bit prime
G = 2           #Generator

# Master Secret (s) - generated once when the system boots
MASTER_SECRET = secrets.randbelow(P - 2) + 1

def hash_identity_to_group(identity_string: str) -> int:
    """
    Hashes the license plate string to an integer element in the group Z_p*.
    Corresponds to Q_ID = H(LP).
    """
    hash_hex = hashlib.sha256(identity_string.encode('utf-8')).hexdigest()
    hash_int = int(hash_hex, 16)
    return (hash_int % (P - 1)) + 1 

def generate_private_key(q_id: int) -> int:
    """
    Computes d_ID = (Q_ID)^s (mod P)
    """
    return pow(q_id, MASTER_SECRET, P)

def get_master_public_key() -> int:
    """
    Computes P_pub = G^s (mod P)
    """
    return pow(G, MASTER_SECRET, P)