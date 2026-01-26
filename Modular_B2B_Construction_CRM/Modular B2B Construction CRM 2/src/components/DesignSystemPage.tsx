import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

export const DesignSystemPage: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-display-36 text-[#111827] mb-4">Gold.Arch Design System</h1>
        <p className="text-body text-[#6B7280]">
          A comprehensive design system for B2B construction CRM, optimized for Next.js, Tailwind CSS, and shadcn-ui
        </p>
      </div>

      {/* Colors */}
      <section className="mb-16">
        <h2 className="text-h2 text-[#111827] mb-6">Color Palette</h2>
        
        <div className="space-y-8">
          {/* Primary */}
          <div>
            <h3 className="text-h4 text-[#111827] mb-4">Primary Blue</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-24 bg-[#2563EB] rounded-lg shadow-card"></div>
                <p className="text-sm font-medium text-[#111827]">Primary</p>
                <p className="text-xs font-mono text-[#6B7280]">#2563EB</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#1E40AF] rounded-lg shadow-card"></div>
                <p className="text-sm font-medium text-[#111827]">Dark</p>
                <p className="text-xs font-mono text-[#6B7280]">#1E40AF</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#DBEAFE] rounded-lg border border-[#E5E7EB]"></div>
                <p className="text-sm font-medium text-[#111827]">Light</p>
                <p className="text-xs font-mono text-[#6B7280]">#DBEAFE</p>
              </div>
            </div>
          </div>

          {/* Accents */}
          <div>
            <h3 className="text-h4 text-[#111827] mb-4">Accents</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-24 bg-[#F59E0B] rounded-lg shadow-card"></div>
                <p className="text-sm font-medium text-[#111827]">Gold</p>
                <p className="text-xs font-mono text-[#6B7280]">#F59E0B</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#EA580C] rounded-lg shadow-card"></div>
                <p className="text-sm font-medium text-[#111827]">Orange</p>
                <p className="text-xs font-mono text-[#6B7280]">#EA580C</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-h4 text-[#111827] mb-4">Status Colors</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-24 bg-[#10B981] rounded-lg shadow-card"></div>
                <p className="text-sm font-medium text-[#111827]">Success</p>
                <p className="text-xs font-mono text-[#6B7280]">#10B981</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#F59E0B] rounded-lg shadow-card"></div>
                <p className="text-sm font-medium text-[#111827]">Warning</p>
                <p className="text-xs font-mono text-[#6B7280]">#F59E0B</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#EF4444] rounded-lg shadow-card"></div>
                <p className="text-sm font-medium text-[#111827]">Error</p>
                <p className="text-xs font-mono text-[#6B7280]">#EF4444</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#3B82F6] rounded-lg shadow-card"></div>
                <p className="text-sm font-medium text-[#111827]">Info</p>
                <p className="text-xs font-mono text-[#6B7280]">#3B82F6</p>
              </div>
            </div>
          </div>

          {/* AI Colors */}
          <div>
            <h3 className="text-h4 text-[#111827] mb-4">AI Colors</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-24 bg-[#8B5CF6] rounded-lg shadow-ai-glow"></div>
                <p className="text-sm font-medium text-[#111827]">AI Purple</p>
                <p className="text-xs font-mono text-[#6B7280]">#8B5CF6</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-lg shadow-ai-glow"></div>
                <p className="text-sm font-medium text-[#111827]">AI Gradient</p>
                <p className="text-xs font-mono text-[#6B7280]">135° Purple→Pink</p>
              </div>
              <div className="space-y-2">
                <div className="h-24 bg-[#FEF3C7] rounded-lg border border-[#E5E7EB]"></div>
                <p className="text-sm font-medium text-[#111827]">Highlight</p>
                <p className="text-xs font-mono text-[#6B7280]">#FEF3C7</p>
              </div>
            </div>
          </div>

          {/* Neutrals */}
          <div>
            <h3 className="text-h4 text-[#111827] mb-4">Neutrals</h3>
            <div className="grid grid-cols-5 gap-4">
              {[
                { name: '900', value: '#111827' },
                { name: '800', value: '#1F2937' },
                { name: '700', value: '#374151' },
                { name: '600', value: '#4B5563' },
                { name: '500', value: '#9CA3AF' },
                { name: '400', value: '#D1D5DB' },
                { name: '300', value: '#E5E7EB' },
                { name: '200', value: '#F3F4F6' },
                { name: '100', value: '#F9FAFB' },
                { name: '50', value: '#FFFFFF' },
              ].map((color) => (
                <div key={color.name} className="space-y-2">
                  <div
                    className="h-16 rounded-lg border border-[#E5E7EB]"
                    style={{ backgroundColor: color.value }}
                  ></div>
                  <p className="text-xs font-medium text-[#111827]">N-{color.name}</p>
                  <p className="text-xs font-mono text-[#6B7280]">{color.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="mb-16">
        <h2 className="text-h2 text-[#111827] mb-6">Typography</h2>
        <div className="space-y-4 bg-white rounded-lg border border-[#E5E7EB] p-8">
          <div className="border-b border-[#E5E7EB] pb-4">
            <p className="text-display-48">Display 48 Bold</p>
            <p className="text-xs text-[#6B7280] mt-2">48px / Bold / Line-height 1.1</p>
          </div>
          <div className="border-b border-[#E5E7EB] pb-4">
            <p className="text-display-36">Display 36 Bold</p>
            <p className="text-xs text-[#6B7280] mt-2">36px / Bold / Line-height 1.2</p>
          </div>
          <div className="border-b border-[#E5E7EB] pb-4">
            <h1>Heading 1 - 30px Semibold</h1>
            <p className="text-xs text-[#6B7280] mt-2">30px / Semibold / Line-height 1.2</p>
          </div>
          <div className="border-b border-[#E5E7EB] pb-4">
            <h2>Heading 2 - 24px Semibold</h2>
            <p className="text-xs text-[#6B7280] mt-2">24px / Semibold / Line-height 1.3</p>
          </div>
          <div className="border-b border-[#E5E7EB] pb-4">
            <h3>Heading 3 - 20px Semibold</h3>
            <p className="text-xs text-[#6B7280] mt-2">20px / Semibold / Line-height 1.4</p>
          </div>
          <div className="border-b border-[#E5E7EB] pb-4">
            <p className="text-body">Body 16px - Regular body text with comfortable line-height for reading</p>
            <p className="text-xs text-[#6B7280] mt-2">16px / Regular / Line-height 24px</p>
          </div>
          <div className="border-b border-[#E5E7EB] pb-4">
            <p className="text-body-sm">Body Small 14px - Used for secondary information and captions</p>
            <p className="text-xs text-[#6B7280] mt-2">14px / Regular / Line-height 20px</p>
          </div>
          <div className="border-b border-[#E5E7EB] pb-4">
            <p className="text-cap">Caption 12px uppercase</p>
            <p className="text-xs text-[#6B7280] mt-2">12px / Uppercase / Tracking 0.05em / Line-height 16px</p>
          </div>
          <div>
            <p className="text-tiny">Tiny 11px Medium - Used in badges and tags</p>
            <p className="text-xs text-[#6B7280] mt-2">11px / Medium / Line-height 14px</p>
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section className="mb-16">
        <h2 className="text-h2 text-[#111827] mb-6">Spacing System (8px Grid)</h2>
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-8">
          <div className="space-y-4">
            {[4, 8, 12, 16, 24, 32, 48, 64].map((size) => (
              <div key={size} className="flex items-center gap-4">
                <div className="w-24 text-sm font-mono text-[#6B7280]">{size}px</div>
                <div className="h-8 bg-[#2563EB] rounded" style={{ width: `${size}px` }}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Border Radius */}
      <section className="mb-16">
        <h2 className="text-h2 text-[#111827] mb-6">Border Radius</h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { name: 'Tag', value: '4px' },
            { name: 'Input', value: '6px' },
            { name: 'Card', value: '8px' },
            { name: 'Feature', value: '12px' },
            { name: 'Pill', value: '9999px' },
          ].map((radius) => (
            <div key={radius.name} className="bg-white border border-[#E5E7EB] p-6 text-center">
              <div
                className="w-20 h-20 bg-[#2563EB] mx-auto mb-3"
                style={{ borderRadius: radius.value }}
              ></div>
              <p className="text-sm font-medium text-[#111827]">{radius.name}</p>
              <p className="text-xs font-mono text-[#6B7280]">{radius.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section className="mb-16">
        <h2 className="text-h2 text-[#111827] mb-6">Shadows</h2>
        <div className="grid grid-cols-5 gap-6">
          <div className="text-center">
            <div className="w-full h-24 bg-white rounded-lg mb-3" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}></div>
            <p className="text-sm font-medium text-[#111827]">Hover</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-white rounded-lg mb-3" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}></div>
            <p className="text-sm font-medium text-[#111827]">Card</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-white rounded-lg mb-3" style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}></div>
            <p className="text-sm font-medium text-[#111827]">Modal</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-white rounded-lg mb-3" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}></div>
            <p className="text-sm font-medium text-[#111827]">Dropdown</p>
          </div>
          <div className="text-center">
            <div className="w-full h-24 bg-[#8B5CF6] rounded-lg mb-3 shadow-ai-glow"></div>
            <p className="text-sm font-medium text-[#111827]">AI Glow</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="mb-16">
        <h2 className="text-h2 text-[#111827] mb-6">Buttons</h2>
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-8 space-y-6">
          <div>
            <h3 className="text-h4 text-[#111827] mb-4">Variants</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </div>
          <div>
            <h3 className="text-h4 text-[#111827] mb-4">Sizes</h3>
            <div className="flex items-center gap-3">
              <Button variant="primary" size="sm">Small (32px)</Button>
              <Button variant="primary" size="md">Medium (40px)</Button>
              <Button variant="primary" size="lg">Large (48px)</Button>
            </div>
          </div>
          <div>
            <h3 className="text-h4 text-[#111827] mb-4">With Icons</h3>
            <div className="flex gap-3">
              <Button variant="primary" icon={<Sparkles className="h-4 w-4" />}>
                With Icon
              </Button>
              <Button variant="icon" size="md" icon={<Sparkles className="h-5 w-5" />} />
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="mb-16">
        <h2 className="text-h2 text-[#111827] mb-6">Badges & Tags</h2>
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-8">
          <div className="flex flex-wrap gap-3">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="default">Default</Badge>
            <Badge variant="ai">AI Powered</Badge>
            <Badge variant="info" count={5}>With Count</Badge>
          </div>
        </div>
      </section>
    </div>
  );
};
