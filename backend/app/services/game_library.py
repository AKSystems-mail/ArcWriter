from typing import Dict, List, Tuple, Any, Optional

# Standard Payoff Matrices (Standardized Utilities)
# Format: { Player_A_Strategy: { Player_B_Strategy: (Payoff_A, Payoff_B) } }
# Values (Standardized ordinal rankings): 
# 5 = Best (Temptation/Win)
# 3 = Second Best (Reward/Mutual)
# 1 = Third Best (Punishment/Stalemate)
# 0 = Worst (Sucker/Loss/Crash)

GAME_LIBRARY = {
    "Prisoner's Dilemma": {
        "description": "Incentive to defect, but mutual cooperation is better than mutual defection.",
        "strategies": ["Cooperate", "Defect"],
        "matrix": {
            "Cooperate": {
                "Cooperate": (3, 3), # Reward (R)
                "Defect": (0, 5)     # Sucker (S), Temptation (T)
            },
            "Defect": {
                "Cooperate": (5, 0), # Temptation (T), Sucker (S)
                "Defect": (1, 1)     # Punishment (P)
            }
        },
        # Inequality: T > R > P > S (5 > 3 > 1 > 0)
        "payoff_ranking": ["T", "R", "P", "S"]
    },
    "Chicken": {
        "description": "Mutual defection is catastrophic. The rational move is to do the opposite of your opponent.",
        "strategies": ["Swerve", "Straight"],
        "matrix": {
            "Swerve": {
                "Swerve": (3, 3),    # Tie/Mutual Cowardice
                "Straight": (1, 5)   # Chicken, Winner
            },
            "Straight": {
                "Swerve": (5, 1),    # Winner, Chicken
                "Straight": (0, 0)   # Crash (Catastrophe)
            }
        },
        # Inequality: T > R > S > P (5 > 3 > 1 > 0) - Note: S here is > P (Crash)
        "payoff_ranking": ["T", "R", "S", "P"] 
    },
    "Stag Hunt": {
        "description": "Coordination game. Mutual cooperation is best, but risky if the other defects.",
        "strategies": ["Hunt Stag", "Hunt Hare"],
        "matrix": {
            "Hunt Stag": {
                "Hunt Stag": (5, 5), # Best (Stag)
                "Hunt Hare": (0, 3)  # Worst, Safe
            },
            "Hunt Hare": {
                "Hunt Stag": (3, 0), # Safe, Worst
                "Hunt Hare": (3, 3)  # Safe (Hare)
            }
        },
        # Inequality: R > T >= P > S (Coordinate > Defect)
    },
    "Zero-Sum": {
        "description": "Pure competition. My gain is exactly your loss.",
        "strategies": ["A", "B"], # Generic
        "matrix": {
            "A": {"A": (1, -1), "B": (-1, 1)},
            "B": {"A": (-1, 1), "B": (1, -1)}
        }
    }
}

def identify_game_archetype(scene_layout: Dict[str, Any]) -> str:
    """
    Identifies the game archetype based on the structural inequalities of payoffs.
    Expects scene_layout to have 'payoff_matrix' with integer or float values.
    
    This is a simplified classifier based on Ordinal Payoffs (T, R, P, S).
    Assumption: Matrix is symmetric 2x2 for classification purposes.
    """
    # 1. Extract payoffs into T, R, P, S format if possible
    # We need to map the LLM's arbitrary strategy names to generic "Cooperate" vs "Defect"
    # or simply analyze the numerical relationships.
    
    # Generic analysis: Flatten payoffs
    # scene_matrix format: { "Strat1": { "Strat1": [p1a, p1b] ... } }
    
    # For MVP, we'll try to match the "Pattern" of values provided by the LLM 
    # against the standard libraries.
    
    # Heuristic: Calculate 'Temptation', 'Reward', 'Punishment', 'Sucker' from the matrix
    # This requires knowing which strategy is "Cooperate" (C) and which is "Defect" (D).
    # We can try permutations.
    
    # Simplified approach: Look for key signatures.
    
    # Check for Zero-Sum uniqueness
    is_zero_sum = True
    for strat_a, row in scene_layout.items():
        for strat_b, payoffs in row.items():
            if payoffs[0] + payoffs[1] != 0:
                is_zero_sum = False
                break
    if is_zero_sum:
        return "Zero-Sum"

    # Analyze for PD vs Chicken vs Stag Hunt
    # We need to identify C and D.
    # C-C usually has a good mutual outcome (R).
    # D-D usually has a poor mutual outcome (P).
    # D-C gives D the highest payoff (T) and C the lowest (S).
    
    # Let's try to map the provided matrix values to standard 5,3,1,0 scale roughly
    # or just check inequalities.
    
    # Example detection for Prisoner's Dilemma: T > R > P > S
    # We iterate through all permutations of strategy assignments to C and D to see if any match the PD inequality.
    
    strategies = list(scene_layout.keys())
    if len(strategies) != 2:
        return "Unknown (Complex)"
        
    s1, s2 = strategies[0], strategies[1]
    
    # Permutation 1: s1=Cooperate, s2=Defect
    # R = (s1, s1), S = (s1, s2), T = (s2, s1), P = (s2, s2)
    # Check A's payoffs
    
    def check_pd(r, s, t, p):
        return t > r and r > p and p > s

    def check_chicken(r, s, t, p):
        return t > r and r > s and s > p
    
    def check_stag_hunt(r, s, t, p):
         return r > t and p >= s # Simplification
        
    # Get values for Player A
    try:
        # Case 1: s1=C, s2=D
        r1 = scene_layout[s1][s1][0]
        s1_val = scene_layout[s1][s2][0]
        t1 = scene_layout[s2][s1][0]
        p1 = scene_layout[s2][s2][0]
        
        if check_pd(r1, s1_val, t1, p1): return "Prisoner's Dilemma"
        if check_chicken(r1, s1_val, t1, p1): return "Chicken"
        if check_stag_hunt(r1, s1_val, t1, p1): return "Stag Hunt"

        # Case 2: s1=D, s2=C (Inverse)
        # R = (s2, s2), S = (s2, s1), T = (s1, s2), P = (s1, s1)
        r2 = scene_layout[s2][s2][0]
        s2_val = scene_layout[s2][s1][0]
        t2 = scene_layout[s1][s2][0]
        p2 = scene_layout[s1][s1][0]

        if check_pd(r2, s2_val, t2, p2): return "Prisoner's Dilemma"
        if check_chicken(r2, s2_val, t2, p2): return "Chicken"
        if check_stag_hunt(r2, s2_val, t2, p2): return "Stag Hunt"

    except KeyError:
        return "Invalid Matrix"

    return "Unclassified Game"


def generate_logic_critique(game_name: str, character_move: str, equilibrium: List[str]) -> str:
    """
    Generates a deterministic critique based on the game rules.
    """
    # Simply check if the move matches the equilibrium
    # equilibrium is typically a list of strategies, e.g., ["Defect", "Defect"]
    # character_move might be "Cooperate"
    
    # We assume 'character_move' is the move of the Protagonist (Player A)
    # And we compare it to the Equilibrium strategy for Player A.
    
    # Handle multiple equilibria (e.g., Chicken has two pure ones)
    
    equilibrium_moves = [eq[0] for eq in equilibrium] # Get Player A's strat from all equilibria tuples
    
    if character_move in equilibrium_moves:
        return f"In a game of {game_name}, choosing '{character_move}' is a rational move consistent with the Nash Equilibrium. The character is playing to win (or survive)."
    else:
        # Construct specific advice based on the game
        if game_name == "Prisoner's Dilemma":
            return f"In a {game_name}, the rational equilibrium is usually to Defect. By choosing '{character_move}', the character is either being naive (Sucker's payoff) or taking a noble risk that requires the other to cooperate against their self-interest."
        elif game_name == "Chicken":
            return f"In a game of {game_name}, the goal is to convince the opponent you will not Swerve. Choosing '{character_move}' might be safe, but it cedes dominance if the opponent plays aggressive."
        elif game_name == "Stag Hunt":
            return f"This is a {game_name} (Coordination). Choosing '{character_move}' requires trust. If the other player doesn't match this, the character fails."
        else:
            return f"The move '{character_move}' deviates from the calculated Nash Equilibrium {equilibrium}. Ensure there is a strong emotional or plot-driven reason for this irrationality."
