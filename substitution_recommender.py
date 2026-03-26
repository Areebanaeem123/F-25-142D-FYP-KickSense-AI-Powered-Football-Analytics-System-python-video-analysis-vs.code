"""
Substitution Recommender Module
Calculates substitution priority based on disciplinary risk (foul/card likelihood).
"""

from typing import Dict, List

class SubstitutionRecommender:
    def __init__(self, high_risk_threshold: float = 75.0):
        self.high_risk_threshold = high_risk_threshold

    def recommend(self, foul_map: Dict) -> Dict[int, float]:
        """
        Calculates substitution priority (0-100) based on card likelihoods.
        Higher risk of yellow/red cards = higher substitution priority.
        """
        recommendations = {}
        
        for track_id, metrics in foul_map.items():
            yellow = metrics.get("yellow_likelihood", 0.0)
            red = metrics.get("red_likelihood", 0.0)
            foul_risk = metrics.get("foul_risk", 0.0)
            
            # Priority score (0-100)
            # Max of yellow/red likelihood converted to percentage
            score = max(yellow, red) * 100.0
            
            # Special case: if foul risk is very high even if card likelihood hasn't peaked yet
            if foul_risk > 0.8:
                score = max(score, 80.0)
                
            recommendations[track_id] = round(score, 2)
            
        return recommendations
