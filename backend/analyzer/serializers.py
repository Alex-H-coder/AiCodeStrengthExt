from rest_framework import serializers


class AnalyzeRequestSerializer(serializers.Serializer):
    """Serializer for incoming code analysis requests."""
    code = serializers.CharField(required=True, allow_blank=False)
    language = serializers.CharField(required=False, default='python', max_length=50)


class DuplicateBlockSerializer(serializers.Serializer):
    """Represents a single detected duplicate code block."""
    start_line = serializers.IntegerField()
    end_line = serializers.IntegerField()
    duplicate_of_line = serializers.IntegerField()
    content = serializers.CharField()


class AnalyzeResponseSerializer(serializers.Serializer):
    """Full analysis response payload."""
    strength_score = serializers.FloatField()
    strength_label = serializers.CharField()
    strength_breakdown = serializers.DictField()
    duplicates = DuplicateBlockSerializer(many=True)
    recommendations = serializers.ListField(child=serializers.CharField())
    language = serializers.CharField()
