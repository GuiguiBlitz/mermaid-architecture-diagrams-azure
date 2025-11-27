import mermaid from 'mermaid';
import customIconData from './azure-icons.json'; 

// 🎯 UPDATED IMPORTS: logic is cleaner now
import { basicSetup, EditorView } from "codemirror";
import { EditorState } from "@codemirror/state"; // Sometimes still needed explicitly for state creation
import { oneDark } from "@codemirror/theme-one-dark";

// --- MERMAID SETUP ---
mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose' 
});

mermaid.registerIconPacks([
    {
        name: customIconData.prefix, 
        loader: () => customIconData,
    },
]);

const initialMermaidText = `
architecture-beta
    group api(cloud)[API]

    service db(azure:databases-azure-database-postgresql-server)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(azure:databases-azure-database-postgresql-server)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db`;

// --- RENDER FUNCTION ---
async function renderDiagram(graphDefinition) {
    const container = document.getElementById('diagram-container');
    container.innerHTML = ''; 

    try {
        const { svg, bindFunctions } = await mermaid.render('live-diagram', graphDefinition);
        container.innerHTML = svg;
        if (bindFunctions) bindFunctions(container);
    } catch (error) {
        container.innerHTML = `<pre style="color: red;">Error: ${error.message}</pre>`;
    }
}

// --- CODEMIRROR SETUP ---

const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
        renderDiagram(update.state.doc.toString());
    }
});

const startState = EditorState.create({
    doc: initialMermaidText,
    extensions: [
        basicSetup, // Includes line numbers, bracket matching, etc.
        oneDark,    // The dark theme
        updateListener,
        EditorView.lineWrapping // Optional: wraps long lines
    ]
});

// Mount the editor
const editor = new EditorView({
    state: startState,
    parent: document.getElementById('code-editor')
});

// Initial Render
renderDiagram(initialMermaidText);