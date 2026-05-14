import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FeaturePage from './pages/FeaturePage'
import PolicyRecommendation from './pages/PolicyRecommendation'
import AICenter from './pages/AICenter'
import Pass5Tools from './pages/Pass5Tools'

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticUnderwritingAutomationHandling from './pages/CfAgenticUnderwritingAutomationHandling';
import CfFraudSyndicateDetectionCorrelatingAp from './pages/CfFraudSyndicateDetectionCorrelatingAp';
import CfPremiumDynamismRecommendingRealTime from './pages/CfPremiumDynamismRecommendingRealTime';
import CfCustomerRiskTrajectoryModelingOverP from './pages/CfCustomerRiskTrajectoryModelingOverP';
import CfRenewalsOptimizationPredictingLikelih from './pages/CfRenewalsOptimizationPredictingLikelih';
import CfRuleEngineOptimizationRecommendingUp from './pages/CfRuleEngineOptimizationRecommendingUp';
import GapNoRiskScoreEndpointBackedBy from './pages/GapNoRiskScoreEndpointBackedBy';
import GapNoAiPremiumRateRecommender from './pages/GapNoAiPremiumRateRecommender';
import GapNoFraudProbabilityAi from './pages/GapNoFraudProbabilityAi';
import GapNoPolicyRecommendationEngine from './pages/GapNoPolicyRecommendationEngine';
import GapNoRenewalPredictionModel from './pages/GapNoRenewalPredictionModel';
import GapNoRuleOptimizationAnalyzer from './pages/GapNoRuleOptimizationAnalyzer';
import GapLiveRatingBureauIntegrationStillSca from './pages/GapLiveRatingBureauIntegrationStillSca';
import GapNoWebhookSurfaceForApplicationEvent from './pages/GapNoWebhookSurfaceForApplicationEvent';
import GapNoFileUploadForSupportingDocuments from './pages/GapNoFileUploadForSupportingDocuments';
import GapNoESignatureForBinderspolicies from './pages/GapNoESignatureForBinderspolicies';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/feature/:slug" element={<PrivateRoute><FeaturePage /></PrivateRoute>} />
        <Route path="/policy-recommendation" element={<PrivateRoute><PolicyRecommendation /></PrivateRoute>} />
        <Route path="/ai-center" element={<PrivateRoute><AICenter /></PrivateRoute>} />
        <Route path="/pass5-tools" element={<PrivateRoute><Pass5Tools /></PrivateRoute>} />
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-underwriting-automation-handling" element={<CfAgenticUnderwritingAutomationHandling />} />
          <Route path="/cf-fraud-syndicate-detection-correlating-ap" element={<CfFraudSyndicateDetectionCorrelatingAp />} />
          <Route path="/cf-premium-dynamism-recommending-real-time-" element={<CfPremiumDynamismRecommendingRealTime />} />
          <Route path="/cf-customer-risk-trajectory-modeling-over-p" element={<CfCustomerRiskTrajectoryModelingOverP />} />
          <Route path="/cf-renewals-optimization-predicting-likelih" element={<CfRenewalsOptimizationPredictingLikelih />} />
          <Route path="/cf-rule-engine-optimization-recommending-up" element={<CfRuleEngineOptimizationRecommendingUp />} />
          <Route path="/gap-no-risk-score-endpoint-backed-by" element={<GapNoRiskScoreEndpointBackedBy />} />
          <Route path="/gap-no-ai-premium-rate-recommender" element={<GapNoAiPremiumRateRecommender />} />
          <Route path="/gap-no-fraud-probability-ai" element={<GapNoFraudProbabilityAi />} />
          <Route path="/gap-no-policy-recommendation-engine" element={<GapNoPolicyRecommendationEngine />} />
          <Route path="/gap-no-renewal-prediction-model" element={<GapNoRenewalPredictionModel />} />
          <Route path="/gap-no-rule-optimization-analyzer" element={<GapNoRuleOptimizationAnalyzer />} />
          <Route path="/gap-live-rating-bureau-integration-still-sca" element={<GapLiveRatingBureauIntegrationStillSca />} />
          <Route path="/gap-no-webhook-surface-for-application-event" element={<GapNoWebhookSurfaceForApplicationEvent />} />
          <Route path="/gap-no-file-upload-for-supporting-documents" element={<GapNoFileUploadForSupportingDocuments />} />
          <Route path="/gap-no-e-signature-for-binderspolicies" element={<GapNoESignatureForBinderspolicies />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
