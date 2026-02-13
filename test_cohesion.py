
import unittest
import sys
from unittest.mock import MagicMock
import numpy as np

# Mock cv2 before importing cohesion_analyzer
sys.modules["cv2"] = MagicMock()

from cohesion_analyzer import CohesionAnalyzer

class TestCohesionAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = CohesionAnalyzer()

    def test_normal_case(self):
        # A simple triangle
        positions = [(0, 0), (10, 0), (5, 8.66)]
        score = self.analyzer.calculate_cohesion_index(positions)
        self.assertIsNotNone(score)
        self.assertTrue(0 <= score['cohesion_index'] <= 100)

    def test_collinear(self):
        # Three points in a line (Area = 0)
        positions = [(0, 0), (5, 0), (10, 0)]
        # This currently returns None or low score in original code, should be high compactness
        score = self.analyzer.calculate_cohesion_index(positions)
        print(f"Collinear Score: {score}") 
        # After my fix, this might still have area 0, but logic should handle it. 
        # Actually convex hull of collinear points is 0 volume/area.
        
    def test_identical_points(self):
        # All players at same spot (Extremely compact)
        positions = [(5, 5), (5, 5), (5, 5)]
        score = self.analyzer.calculate_cohesion_index(positions)
        self.assertIsNotNone(score, "Should handle identical points")
        self.assertEqual(score['cohesion_index'], 100, "Identical points should have max cohesion")

    def test_insufficient_players(self):
        positions = [(0,0), (1,1)]
        score = self.analyzer.calculate_cohesion_index(positions)
        self.assertIsNone(score)

if __name__ == '__main__':
    unittest.main()
