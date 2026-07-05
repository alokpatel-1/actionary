export interface NoteTemplate {
  label: string;
  icon: string;
  content: string; // HTML string ready for Tiptap
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    label: 'Meeting Notes',
    icon: '📋',
    content: `<h2>Meeting Notes</h2>
<p><strong>Date:</strong> </p>
<p><strong>Attendees:</strong> </p>
<h3>Agenda</h3>
<ul><li><p></p></li></ul>
<h3>Discussion</h3>
<p></p>
<h3>Action Items</h3>
<ul data-type="taskList"><li data-checked="false"><label><input type="checkbox"></label><div><p></p></div></li></ul>
<h3>Next Steps</h3>
<p></p>`
  },
  {
    label: 'Daily Journal',
    icon: '📔',
    content: `<h2>Daily Journal</h2>
<p><strong>Date:</strong> </p>
<h3>How I\'m feeling today</h3>
<p></p>
<h3>What I accomplished</h3>
<ul><li><p></p></li></ul>
<h3>What I\'m grateful for</h3>
<ul><li><p></p></li></ul>
<h3>Goals for tomorrow</h3>
<ul><li><p></p></li></ul>`
  },
  {
    label: 'Quick Idea',
    icon: '💡',
    content: `<h2>Idea</h2>
<p><strong>Summary:</strong> </p>
<h3>Problem it solves</h3>
<p></p>
<h3>How it works</h3>
<p></p>
<h3>Next action</h3>
<p></p>`
  },
  {
    label: 'Study Plan',
    icon: '📚',
    content: `<h2>Study Plan</h2>
<p><strong>Topic:</strong> </p>
<p><strong>Goal:</strong> </p>
<h3>Key concepts to cover</h3>
<ul><li><p></p></li></ul>
<h3>Resources</h3>
<ul><li><p></p></li></ul>
<h3>Notes</h3>
<p></p>
<h3>Summary</h3>
<p></p>`
  },
  {
    label: 'Bug Report',
    icon: '🐛',
    content: `<h2>Bug Report</h2>
<p><strong>Environment:</strong> </p>
<p><strong>Severity:</strong> </p>
<h3>Description</h3>
<p></p>
<h3>Steps to Reproduce</h3>
<ol><li><p></p></li></ol>
<h3>Expected vs Actual Behavior</h3>
<p><strong>Expected:</strong> </p>
<p><strong>Actual:</strong> </p>
<h3>Possible Fix</h3>
<p></p>`
  }
];
