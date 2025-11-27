import mermaid from 'mermaid';
import customIconData from './custom-azure-icons.json'; 
import { basicSetup, EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";

// --- 1. MERMAID CONFIG ---
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

// --- 2. RENDER FUNCTION ---
async function renderDiagram(graphDefinition) {
    const container = document.getElementById('diagram-container');
    // Save the scroll position if needed, or just clear
    container.innerHTML = ''; 

    try {
        // We use a unique ID 'live-diagram' for the graph
        const { svg, bindFunctions } = await mermaid.render('live-diagram', graphDefinition);
        container.innerHTML = svg;
        
        // If there are interaction functions (clicks, tooltips), bind them
        if (bindFunctions) {
            bindFunctions(container);
        }
    } catch (error) {
        // Render error nicely in the view
        container.innerHTML = `
            <div style="color: #ff5555; font-family: monospace; padding: 20px;">
                <strong>Render Error:</strong><br>
                ${error.message}
            </div>
        `;
        console.error('Mermaid rendering failed:', error);
    }
}

// --- 3. SIDEBAR LOGIC ---
function loadIconsToSidebar() {
    const listContainer = document.getElementById('icon-list');
    const prefix = customIconData.prefix;
    
    // Group Icons by Category (the part before the first hyphen)
    const groups = {};

    Object.keys(customIconData.icons).forEach(key => {
        // logic: 'analytics-batch-ai' -> category: 'analytics', name: 'batch-ai'
        const parts = key.split('-');
        let category = 'General';
        let displayName = key;

        if (parts.length > 1) {
            category = parts[0]; 
            displayName = parts.slice(1).join('-'); 
        }

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push({
            fullKey: key,
            displayName: displayName,
            data: customIconData.icons[key]
        });
    });

    // Render Groups
    const sortedCategories = Object.keys(groups).sort();

    sortedCategories.forEach(category => {
        // Create Header
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerText = category;
        listContainer.appendChild(header);

        // Create Grid
        const grid = document.createElement('div');
        grid.className = 'category-grid';

        // Add icons
        groups[category].forEach(icon => {
            const iconCode = `${prefix}-${icon.fullKey}`;
            
            const item = document.createElement('div');
            item.className = 'icon-item';
            item.title = `Click to copy: ${iconCode}`;

            const width = icon.data.width || 24;
            const height = icon.data.height || 24;
            
            item.innerHTML = `
                <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
                    ${icon.data.body}
                </svg>
                <div class="icon-name">${icon.displayName}</div>
            `;

            // Click interaction
            item.addEventListener('click', () => {
                navigator.clipboard.writeText(iconCode);
                const nameEl = item.querySelector('.icon-name');
                const originalText = nameEl.innerText;
                const originalColor = nameEl.style.color;
                
                nameEl.innerText = "Copied!";
                nameEl.style.color = "#4daafc";
                
                setTimeout(() => {
                    nameEl.innerText = originalText;
                    nameEl.style.color = originalColor || "#aaa";
                }, 1000);
            });

            grid.appendChild(item);
        });

        listContainer.appendChild(grid);
    });
}

function setupSidebarInteractions() {
    const sidebar = document.getElementById('icon-sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    const closeBtn = document.getElementById('close-sidebar');

    const toggle = () => sidebar.classList.toggle('open');

    if(toggleBtn) toggleBtn.addEventListener('click', toggle);
    if(closeBtn) closeBtn.addEventListener('click', toggle);
}
function setupSearch() {
    const searchInput = document.getElementById('icon-search');
    const listContainer = document.getElementById('icon-list');

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        
        // Get all category groups
        // Structure is: Header -> Grid -> Icons
        const headers = listContainer.querySelectorAll('.category-header');
        const grids = listContainer.querySelectorAll('.category-grid');

        grids.forEach((grid, index) => {
            const icons = grid.querySelectorAll('.icon-item');
            let hasVisibleIcons = false;

            icons.forEach(icon => {
                // Get the text inside the icon-name div
                const name = icon.querySelector('.icon-name').innerText.toLowerCase();
                
                if (name.includes(term)) {
                    icon.style.display = 'flex'; // Show match
                    hasVisibleIcons = true;
                } else {
                    icon.style.display = 'none'; // Hide mismatch
                }
            });

            // Toggle the Category Header based on if it has any visible children
            const header = headers[index];
            if (hasVisibleIcons) {
                grid.style.display = 'grid';
                header.style.display = 'block';
            } else {
                grid.style.display = 'none';
                header.style.display = 'none';
            }
        });
    });
}
// --- 4. EDITOR SETUP ---
const initialText = `architecture-beta
    group api(azure-general-resource-groups)[rg archi]

    service db(azure:databases-azure-database-postgresql-server)[Database] in api
    service apim(azure-integration-api-management-services)[APIM] in api
    service fa(azure-compute-function-apps)[Function App] in api
    service usr(azure-identity-users)[User]
    
    db:L -- R:fa
    apim:T -- B:fa
    usr:T -- B:apim

`;

const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
        renderDiagram(update.state.doc.toString());
    }
});

const startState = EditorState.create({
    doc: initialText,
    extensions: [ 
        basicSetup, 
        oneDark, 
        updateListener, 
        EditorView.lineWrapping 
    ]
});

// Mount CodeMirror
const editor = new EditorView({
    state: startState,
    parent: document.getElementById('code-editor')
});

// --- 5. INITIAL EXECUTION ---
loadIconsToSidebar();
setupSearch();
setupSidebarInteractions();
renderDiagram(initialText);