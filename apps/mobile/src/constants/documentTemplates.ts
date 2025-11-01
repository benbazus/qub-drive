import { DocumentTemplate, DocumentTemplateType } from '../types/document';

export const DEFAULT_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a blank document',
    content: '',
    type: 'blank',
    category: 'General',
    isDefault: true
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Template for meeting notes and action items',
    content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Attendees:</strong></p>
<ul>
<li></li>
</ul>

<h2>Agenda</h2>
<ol>
<li></li>
</ol>

<h2>Discussion Points</h2>
<ul>
<li></li>
</ul>

<h2>Action Items</h2>
<ul>
<li><strong>Task:</strong> [Description] - <em>Assigned to:</em> [Name] - <em>Due:</em> [Date]</li>
</ul>

<h2>Next Steps</h2>
<ul>
<li></li>
</ul>`,
    type: 'meeting-notes',
    category: 'Business',
    isDefault: true
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'Template for project planning and tracking',
    content: `<h1>Project Plan</h1>
<p><strong>Project Name:</strong></p>
<p><strong>Project Manager:</strong></p>
<p><strong>Start Date:</strong></p>
<p><strong>End Date:</strong></p>

<h2>Project Overview</h2>
<p></p>

<h2>Objectives</h2>
<ul>
<li></li>
</ul>

<h2>Scope</h2>
<h3>In Scope</h3>
<ul>
<li></li>
</ul>

<h3>Out of Scope</h3>
<ul>
<li></li>
</ul>

<h2>Timeline</h2>
<table border="1">
<tr>
<th>Phase</th>
<th>Start Date</th>
<th>End Date</th>
<th>Deliverables</th>
</tr>
<tr>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
</table>

<h2>Resources</h2>
<ul>
<li></li>
</ul>

<h2>Risks</h2>
<ul>
<li></li>
</ul>`,
    type: 'project-plan',
    category: 'Business',
    isDefault: true
  },
  {
    id: 'report',
    name: 'Report',
    description: 'Template for formal reports',
    content: `<h1>Report Title</h1>
<p><strong>Author:</strong></p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Version:</strong> 1.0</p>

<h2>Executive Summary</h2>
<p></p>

<h2>Introduction</h2>
<p></p>

<h2>Methodology</h2>
<p></p>

<h2>Findings</h2>
<p></p>

<h2>Analysis</h2>
<p></p>

<h2>Recommendations</h2>
<ul>
<li></li>
</ul>

<h2>Conclusion</h2>
<p></p>

<h2>Appendices</h2>
<p></p>`,
    type: 'report',
    category: 'Business',
    isDefault: true
  },
  {
    id: 'memo',
    name: 'Memo',
    description: 'Template for internal memos',
    content: `<h1>MEMORANDUM</h1>
<p><strong>TO:</strong></p>
<p><strong>FROM:</strong></p>
<p><strong>DATE:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>RE:</strong></p>

<hr>

<p></p>

<p>If you have any questions, please don't hesitate to contact me.</p>

<p>Best regards,</p>
<p>[Your Name]</p>`,
    type: 'memo',
    category: 'Business',
    isDefault: true
  },
  {
    id: 'letter',
    name: 'Letter',
    description: 'Template for formal letters',
    content: `<p>[Your Name]<br>
[Your Address]<br>
[City, State ZIP Code]<br>
[Email Address]<br>
[Phone Number]</p>

<p>${new Date().toLocaleDateString()}</p>

<p>[Recipient Name]<br>
[Title]<br>
[Company/Organization]<br>
[Address]<br>
[City, State ZIP Code]</p>

<p>Dear [Recipient Name],</p>

<p></p>

<p>Thank you for your time and consideration.</p>

<p>Sincerely,</p>

<p>[Your Name]</p>`,
    type: 'letter',
    category: 'Personal',
    isDefault: true
  },
  {
    id: 'proposal',
    name: 'Proposal',
    description: 'Template for project proposals',
    content: `<h1>Project Proposal</h1>
<p><strong>Proposal Title:</strong></p>
<p><strong>Submitted by:</strong></p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

<h2>Executive Summary</h2>
<p></p>

<h2>Problem Statement</h2>
<p></p>

<h2>Proposed Solution</h2>
<p></p>

<h2>Benefits</h2>
<ul>
<li></li>
</ul>

<h2>Timeline</h2>
<p></p>

<h2>Budget</h2>
<table border="1">
<tr>
<th>Item</th>
<th>Cost</th>
</tr>
<tr>
<td></td>
<td></td>
</tr>
<tr>
<td><strong>Total</strong></td>
<td><strong>$0.00</strong></td>
</tr>
</table>

<h2>Conclusion</h2>
<p></p>`,
    type: 'proposal',
    category: 'Business',
    isDefault: true
  },
  {
    id: 'checklist',
    name: 'Checklist',
    description: 'Template for task checklists',
    content: `<h1>Checklist</h1>
<p><strong>Title:</strong></p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

<h2>Tasks</h2>
<ul>
<li>☐ </li>
<li>☐ </li>
<li>☐ </li>
<li>☐ </li>
<li>☐ </li>
</ul>

<h2>Notes</h2>
<p></p>`,
    type: 'checklist',
    category: 'Personal',
    isDefault: true
  },
  {
    id: 'article',
    name: 'Article',
    description: 'Template for articles and blog posts',
    content: `<h1>Article Title</h1>
<p><strong>Author:</strong></p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

<h2>Introduction</h2>
<p></p>

<h2>Main Content</h2>
<p></p>

<h3>Subheading</h3>
<p></p>

<h2>Conclusion</h2>
<p></p>

<hr>

<p><em>About the Author:</em></p>
<p></p>`,
    type: 'article',
    category: 'Writing',
    isDefault: true
  },
  {
    id: 'resume',
    name: 'Resume',
    description: 'Template for professional resumes',
    content: `<h1>[Your Name]</h1>
<p>[Your Address] | [Phone] | [Email] | [LinkedIn]</p>

<hr>

<h2>Professional Summary</h2>
<p></p>

<h2>Experience</h2>
<h3>[Job Title] - [Company Name]</h3>
<p><em>[Start Date] - [End Date]</em></p>
<ul>
<li></li>
<li></li>
</ul>

<h2>Education</h2>
<h3>[Degree] - [Institution]</h3>
<p><em>[Graduation Date]</em></p>

<h2>Skills</h2>
<ul>
<li></li>
<li></li>
</ul>

<h2>Certifications</h2>
<ul>
<li></li>
</ul>`,
    type: 'resume',
    category: 'Personal',
    isDefault: true
  }
];

export const TEMPLATE_CATEGORIES = [
  'General',
  'Business',
  'Personal',
  'Writing'
];

export function getTemplatesByCategory(category: string): DocumentTemplate[] {
  return DEFAULT_DOCUMENT_TEMPLATES.filter(template => template.category === category);
}

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DEFAULT_DOCUMENT_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByType(type: DocumentTemplateType): DocumentTemplate[] {
  return DEFAULT_DOCUMENT_TEMPLATES.filter(template => template.type === type);
}