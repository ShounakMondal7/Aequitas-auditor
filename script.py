import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

card2_pattern = re.compile(r'(          {/\* Card 2: Live AI Reasoning Logs - True Glassmorphic SpotlightCard \*/}.*?</SpotlightCard>)', re.DOTALL)
card3_pattern = re.compile(r'(          {/\* Card 3 \(Wide Left\): Audit Vault - True Glassmorphic SpotlightCard \*/}.*?</SpotlightCard>)', re.DOTALL)
card4_pattern = re.compile(r'(          {/\* Card 4 \(Right Column\): Floating Human-in-the-Loop Confirmation \*/}.*?</SpotlightCard>)', re.DOTALL)

c2_match = card2_pattern.search(content)
c3_match = card3_pattern.search(content)
c4_match = card4_pattern.search(content)

c2 = c2_match.group(1)
c3 = c3_match.group(1)
c4 = c4_match.group(1)

content = content.replace(c2, '')
content = content.replace(c3, '')
content = content.replace(c4, '')

c1_5_end_pattern = re.compile(r'(<span className="text-xs text-slate-700 dark:text-slate-300 font-medium">New Customer Data</span>\n              </div>\n            </div>\n          </SpotlightCard>)')
c1_5_match = c1_5_end_pattern.search(content)

insertion = c1_5_match.group(1) + '\n\n' + c3 + '\n          </div>\n\n          {/* RIGHT COLUMN */}\n          <div className="lg:col-span-5 flex flex-col space-y-5">\n' + c2 + '\n\n' + c4
content = content.replace(c1_5_match.group(1), insertion)

cleanup_pattern = r'        </div>\s+{/\* ==========================================\s+3\. BOTTOM ROW \(Audit Vault & HITL Card\)\s+========================================== \*/}\s+<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 min-h-\[340px\]">\s*'
content = re.sub(cleanup_pattern, '', content)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Grid restructured successfully.')
