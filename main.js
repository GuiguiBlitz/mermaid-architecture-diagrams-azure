import mermaid from 'mermaid';
import customIconData from './azure-icons.json';

// 1. Initialize Mermaid (startOnLoad: false for API control)
mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose' // Recommended for enabling links/interactivity
});

// 2. Register the Custom Icon Pack
mermaid.registerIconPacks([
    {
        name: customIconData.prefix, // 'myco' from the JSON file
        loader: () => customIconData, // Directly return the imported JSON object
    },
]);

// 3. Define the Diagram using the custom prefix
const graphDefinition = `
architecture-beta
    group api(cloud)[API]

    service db(azure:batch-ai)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(azure:batch-ai)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db
`;

// 4. Render the Diagram
async function renderDiagram() {
    const container = document.getElementById('diagram-container');
    const diagramId = 'custom-diagram';
    
    try {
        const { svg, bindFunctions } = await mermaid.render(diagramId, graphDefinition);
        
        container.innerHTML = svg;
        
        // Bind events if needed (e.g., click handlers)
        if (bindFunctions) {
            bindFunctions(container);
        }
    } catch (error) {
        console.error('Mermaid rendering failed:', error);
        container.innerHTML = `<pre>Error rendering diagram: ${error.message}</pre>`;
    }
}

renderDiagram();