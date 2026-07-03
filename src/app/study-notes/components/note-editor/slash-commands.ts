import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';

export interface CommandItem {
  title: string;
  icon: string;
  command: (props: { editor: any; range: any }) => void;
}

export const getSuggestionItems = ({ query }: { query: string }): CommandItem[] => {
  const items: CommandItem[] = [
    {
      title: 'Heading 1',
      icon: 'pi pi-heading',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      icon: 'pi pi-heading',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      icon: 'pi pi-heading',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      icon: 'pi pi-list',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      icon: 'pi pi-sort-numeric-down',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Task List',
      icon: 'pi pi-check-square',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: 'Quote',
      icon: 'pi pi-comment',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('blockquote').run();
      },
    },
    {
      title: 'Code Block',
      icon: 'pi pi-code',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('codeBlock').run();
      },
    },
    {
      title: 'Divider',
      icon: 'pi pi-minus',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];

  return items.filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
};

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        render: () => {
          let component: any;
          let popup: TippyInstance[];
          let selectedIndex = 0;
          let items: CommandItem[] = [];
          let currentEditor: any;

          const renderMenu = () => {
            if (!component) return;
            component.innerHTML = '';
            
            if (items.length === 0) {
              const noRes = document.createElement('div');
              noRes.className = 'slash-item empty';
              noRes.innerText = 'No results';
              component.appendChild(noRes);
              return;
            }

            items.forEach((item, index) => {
              const button = document.createElement('button');
              button.className = `slash-item ${index === selectedIndex ? 'is-selected' : ''}`;
              
              const icon = document.createElement('i');
              icon.className = item.icon;
              
              const span = document.createElement('span');
              span.innerText = item.title;
              
              button.appendChild(icon);
              button.appendChild(span);

              button.addEventListener('click', () => {
                item.command({ editor: currentEditor, range: component.range });
              });

              component.appendChild(button);
            });
          };

          return {
            onStart: (props: any) => {
              currentEditor = props.editor;
              items = props.items;
              selectedIndex = 0;
              component = document.createElement('div');
              component.className = 'slash-command-menu';
              component.range = props.range;
              
              renderMenu();

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                theme: 'light-border',
                animation: 'shift-away',
              });
            },

            onUpdate(props: any) {
              items = props.items;
              selectedIndex = 0;
              component.range = props.range;
              renderMenu();
              if (popup && popup[0]) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              }
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }

              if (props.event.key === 'ArrowUp') {
                selectedIndex = (selectedIndex + items.length - 1) % items.length;
                renderMenu();
                return true;
              }

              if (props.event.key === 'ArrowDown') {
                selectedIndex = (selectedIndex + 1) % items.length;
                renderMenu();
                return true;
              }

              if (props.event.key === 'Enter') {
                const item = items[selectedIndex];
                if (item) {
                  item.command({ editor: currentEditor, range: component.range });
                }
                return true;
              }

              return false;
            },

            onExit() {
              if (popup && popup[0]) {
                popup[0].destroy();
              }
              if (component) {
                component.remove();
              }
            },
          };
        },
      }),
    ];
  },
});
