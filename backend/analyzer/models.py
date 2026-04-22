from django.db import models


class AnalysisSession(models.Model):
    """Stores a record of each code analysis performed."""
    language = models.CharField(max_length=50, default='python')
    code_analyzed = models.TextField()
    strength_score = models.FloatField(default=0.0)
    duplicate_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    #updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AnalysisSession [{self.language}] score={self.strength_score} -- {self.created_at}"
