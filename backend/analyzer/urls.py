from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.AnalyzeView.as_view(), name='analyze'),
    path('strength/', views.StrengthView.as_view(), name='strength'),
    path('duplicates/', views.DuplicatesView.as_view(), name='duplicates'),
    path('health/', views.HealthView.as_view(), name='health'),
]
