import React from 'react';
import { ArrowRight, Upload, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';

export const UserFlows: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-display-36 text-[#111827] mb-4">User Flows</h1>
        <p className="text-body text-[#6B7280]">
          Critical interaction patterns for Gold.Arch CRM
        </p>
      </div>

      {/* Flow 1: Document Upload → AI Processing */}
      <section className="mb-16">
        <h2 className="text-h2 text-[#111827] mb-8">Flow 1: Document Upload → AI Processing</h2>
        
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          <div className="flex items-start gap-6">
            {/* Step 1 */}
            <div className="flex-1">
              <div className="bg-[#DBEAFE] rounded-lg p-6 mb-4 border-2 border-[#2563EB]">
                <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">1. Upload Trigger</h3>
                <p className="text-sm text-[#6B7280]">
                  User clicks "Upload Document" button or drags file into dropzone
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[#6B7280]"><strong>Entry Points:</strong></p>
                <ul className="list-disc list-inside text-[#6B7280] space-y-1 ml-2">
                  <li>Documents page header CTA</li>
                  <li>Dashboard quick actions</li>
                  <li>Mobile FAB button</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center pt-12">
              <ArrowRight className="h-8 w-8 text-[#9CA3AF]" />
            </div>

            {/* Step 2 */}
            <div className="flex-1">
              <div className="bg-[#F3F4F6] rounded-lg p-6 mb-4 border-2 border-[#9CA3AF]">
                <div className="w-12 h-12 bg-[#6B7280] rounded-lg flex items-center justify-center mb-4">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">2. Upload Modal</h3>
                <p className="text-sm text-[#6B7280]">
                  Modal opens with file dropzone and progress indicator
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[#6B7280]"><strong>States:</strong></p>
                <ul className="list-disc list-inside text-[#6B7280] space-y-1 ml-2">
                  <li>Empty (dropzone)</li>
                  <li>Uploading (0-100%)</li>
                  <li>Processing (AI)</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center pt-12">
              <ArrowRight className="h-8 w-8 text-[#9CA3AF]" />
            </div>

            {/* Step 3 */}
            <div className="flex-1">
              <div className="bg-[#F3E8FF] rounded-lg p-6 mb-4 border-2 border-[#8B5CF6]">
                <div className="w-12 h-12 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-lg flex items-center justify-center mb-4 shadow-ai-glow">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">3. AI Processing</h3>
                <p className="text-sm text-[#6B7280]">
                  Document is analyzed by AI for key information extraction
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[#6B7280]"><strong>Processing:</strong></p>
                <ul className="list-disc list-inside text-[#6B7280] space-y-1 ml-2">
                  <li>Text extraction</li>
                  <li>Metadata parsing</li>
                  <li>Summary generation</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center pt-12">
              <ArrowRight className="h-8 w-8 text-[#9CA3AF]" />
            </div>

            {/* Step 4 */}
            <div className="flex-1">
              <div className="bg-[#D1FAE5] rounded-lg p-6 mb-4 border-2 border-[#10B981]">
                <div className="w-12 h-12 bg-[#10B981] rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">4. Success</h3>
                <p className="text-sm text-[#6B7280]">
                  Success toast appears, document added with "New" badge
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[#6B7280]"><strong>Feedback:</strong></p>
                <ul className="list-disc list-inside text-[#6B7280] space-y-1 ml-2">
                  <li>Toast notification</li>
                  <li>Badge on new item</li>
                  <li>AI summary available</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-8 pt-8 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between text-sm text-[#6B7280]">
              <span>⏱️ Total time: 5-15 seconds</span>
              <span>✅ Success rate target: 99%+</span>
              <span>🎯 Key metric: Time to AI summary</span>
            </div>
          </div>
        </div>
      </section>

      {/* Flow 2: AI Chat Interaction */}
      <section className="mb-16">
        <h2 className="text-h2 text-[#111827] mb-8">Flow 2: AI Chat Assistant</h2>
        
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
          <div className="flex items-start gap-6">
            {/* Step 1 */}
            <div className="flex-1">
              <div className="bg-[#F3F4F6] rounded-lg p-6 mb-4 border-2 border-[#9CA3AF]">
                <div className="w-12 h-12 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center mb-4 shadow-ai-glow">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">1. Collapsed State</h3>
                <p className="text-sm text-[#6B7280]">
                  Floating "Ask AI" pill visible in bottom-right corner
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[#6B7280]"><strong>Visibility:</strong></p>
                <ul className="list-disc list-inside text-[#6B7280] space-y-1 ml-2">
                  <li>Always accessible</li>
                  <li>Subtle AI glow effect</li>
                  <li>Click to expand</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center pt-12">
              <ArrowRight className="h-8 w-8 text-[#9CA3AF]" />
            </div>

            {/* Step 2 */}
            <div className="flex-1">
              <div className="bg-[#F3E8FF] rounded-lg p-6 mb-4 border-2 border-[#8B5CF6]">
                <div className="w-12 h-12 bg-[#8B5CF6] rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">2. Expanded Panel</h3>
                <p className="text-sm text-[#6B7280]">
                  400x600px chat panel opens with context selector
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[#6B7280]"><strong>Elements:</strong></p>
                <ul className="list-disc list-inside text-[#6B7280] space-y-1 ml-2">
                  <li>Context dropdown</li>
                  <li>Chat history</li>
                  <li>Input field</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center pt-12">
              <ArrowRight className="h-8 w-8 text-[#9CA3AF]" />
            </div>

            {/* Step 3 */}
            <div className="flex-1">
              <div className="bg-[#DBEAFE] rounded-lg p-6 mb-4 border-2 border-[#2563EB]">
                <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold">?</span>
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">3. User Query</h3>
                <p className="text-sm text-[#6B7280]">
                  User selects context and types question
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[#6B7280]"><strong>Context Options:</strong></p>
                <ul className="list-disc list-inside text-[#6B7280] space-y-1 ml-2">
                  <li>All sources</li>
                  <li>Documents only</li>
                  <li>Suppliers/Deals</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center pt-12">
              <ArrowRight className="h-8 w-8 text-[#9CA3AF]" />
            </div>

            {/* Step 4 */}
            <div className="flex-1">
              <div className="bg-[#F3F4F6] rounded-lg p-6 mb-4 border-2 border-[#9CA3AF]">
                <div className="w-12 h-12 bg-[#6B7280] rounded-lg flex items-center justify-center mb-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">4. Searching...</h3>
                <p className="text-sm text-[#6B7280]">
                  AI processes query with typing indicator
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[#6B7280]"><strong>Processing:</strong></p>
                <ul className="list-disc list-inside text-[#6B7280] space-y-1 ml-2">
                  <li>Animated dots</li>
                  <li>1-3 second delay</li>
                  <li>Context-aware</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center pt-12">
              <ArrowRight className="h-8 w-8 text-[#9CA3AF]" />
            </div>

            {/* Step 5 */}
            <div className="flex-1">
              <div className="bg-[#FEF3C7] rounded-lg p-6 mb-4 border-2 border-[#F59E0B]">
                <div className="w-12 h-12 bg-[#F59E0B] rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[#111827] mb-2">5. Answer + Citations</h3>
                <p className="text-sm text-[#6B7280]">
                  AI response appears with citation pills linking to sources
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[#6B7280]"><strong>Citations:</strong></p>
                <ul className="list-disc list-inside text-[#6B7280] space-y-1 ml-2">
                  <li>Page references</li>
                  <li>Clickable pills</li>
                  <li>Highlight color</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-8 pt-8 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between text-sm text-[#6B7280]">
              <span>⏱️ Response time: 1-3 seconds</span>
              <span>🎯 Citation accuracy: 95%+</span>
              <span>♻️ Supports follow-up questions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Design Notes */}
      <section className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-8">
        <h2 className="text-h3 text-[#111827] mb-6">Flow Design Principles</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-[#111827] mb-3">⚡ Performance</h3>
            <ul className="text-sm text-[#6B7280] space-y-2">
              <li>• Optimistic UI updates</li>
              <li>• Progress indicators</li>
              <li>• No layout shift</li>
              <li>• Skeleton states</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[#111827] mb-3">♿ Accessibility</h3>
            <ul className="text-sm text-[#6B7280] space-y-2">
              <li>• Keyboard navigation</li>
              <li>• Focus indicators</li>
              <li>• ARIA labels</li>
              <li>• Screen reader support</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[#111827] mb-3">📱 Responsive</h3>
            <ul className="text-sm text-[#6B7280] space-y-2">
              <li>• Touch targets 44px+</li>
              <li>• Mobile-first flows</li>
              <li>• Gesture support</li>
              <li>• Adaptive layouts</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
