"""
Analyzer API Views
==================
Endpoints:
    POST /api/analyze/    - Full analysis (strength + duplicates + AI recommendations)
    POST /api/strength/   - Code strength score only
    POST /api/duplicates/ - Duplicate block detection only
    GET  /api/health/     - Health check
"""
import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AnalysisSession
from .serializers import AnalyzeRequestSerializer
from .services.ai_recommender import get_recommendations
from .services.code_strength import calculate_strength
from .services.duplicate_detector import find_duplicates

logger = logging.getLogger(__name__)


class AnalyzeView(APIView):
    """
    POST /api/analyze/
    Body: { "code": "...", "language": "python" }
    Returns full analysis: strength score, duplicates, AI recommendations.
    """

    def post(self, request):
        serializer = AnalyzeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']
        language = serializer.validated_data.get('language', 'python')

        try:
            # Run all three analyses
            strength_result = calculate_strength(code, language)
            duplicates = find_duplicates(code, language)
            recommendations = get_recommendations(
                code=code,
                language=language,
                strength_score=strength_result['score'],
                breakdown=strength_result['breakdown'],
                duplicate_count=len(duplicates),
            )

            # Persist session (fire-and-forget — don't fail request if DB issue)
            try:
                AnalysisSession.objects.create(
                    language=language,
                    code_snippet=code[:2000],  # Limit stored size
                    strength_score=strength_result['score'],
                    duplicate_count=len(duplicates),
                )
            except Exception as db_err:
                logger.warning(f"Failed to save AnalysisSession: {db_err}")

            return Response({
                "strength_score": strength_result['score'],
                "strength_label": strength_result['label'],
                "strength_breakdown": strength_result['breakdown'],
                "duplicates": duplicates,
                "recommendations": recommendations,
                "language": language,
                "duplicate_count": len(duplicates),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Error during code analysis")
            return Response(
                {"error": f"Analysis failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StrengthView(APIView):
    """
    POST /api/strength/
    Returns only the code strength score and breakdown.
    """

    def post(self, request):
        serializer = AnalyzeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']
        language = serializer.validated_data.get('language', 'python')

        try:
            result = calculate_strength(code, language)
            return Response({
                "strength_score": result['score'],
                "strength_label": result['label'],
                "strength_breakdown": result['breakdown'],
                "language": language,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error during strength calculation")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DuplicatesView(APIView):
    """
    POST /api/duplicates/
    Returns detected duplicate code blocks.
    """

    def post(self, request):
        serializer = AnalyzeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']
        language = serializer.validated_data.get('language', 'python')

        try:
            duplicates = find_duplicates(code, language)
            return Response({
                "duplicates": duplicates,
                "duplicate_count": len(duplicates),
                "language": language,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error during duplicate detection")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HealthView(APIView):
    """GET /api/health/ — service health check."""

    def get(self, request):
        return Response({"status": "ok", "service": "AI Code Analyzer API"})
