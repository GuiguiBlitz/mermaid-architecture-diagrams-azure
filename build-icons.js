const fs = require('fs-extra');
const path = require('path');

const ICON_ROOT_FOLDER = './azure-icons'; 
const OUTPUT_FILE = './custom-azure-icons.json';
const ICON_PREFIX = 'azure'; 
const ICON_WIDTH = 24;
const ICON_HEIGHT = 24;

const NAME_REGEX = /^(\d+)-icon-service-(.*)\.svg$/i; 

/**
 * Cleans a name string for use as an icon ID component.
 * Converts to lowercase, replaces spaces/special characters with hyphens, 
 * and removes leading/trailing/consecutive hyphens.
 * @param {string} name The input string (e.g., 'A+B Studio')
 * @returns {string} The cleaned slug (e.g., 'a-b-studio')
 */
function cleanSlug(name) {
    let slug = name.toLowerCase();
    
    // 1. Replace spaces, slashes, and other special characters with a single hyphen
    slug = slug.replace(/[^a-z0-9-]/g, '-'); 
    
    // 2. Remove consecutive hyphens (e.g., 'a--b' -> 'a-b')
    slug = slug.replace(/-+/g, '-');
    
    // 3. Remove leading/trailing hyphens
    slug = slug.replace(/^-|-$/g, '');
    
    return slug;
}


async function traverseAndExtractIcons(directory, iconPack, category = '') {
    const items = await fs.readdir(directory, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(directory, item.name);

        if (item.isDirectory()) {
            // Recurse: Clean directory name (e.g., 'A + B' -> 'a-b')
            const cleanDirName = cleanSlug(item.name);
            if (cleanDirName === '') continue; // Skip if directory name cleans to nothing
            
            const newCategory = category ? `${category}-${cleanDirName}` : cleanDirName;
            await traverseAndExtractIcons(fullPath, iconPack, newCategory);
        } else if (item.isFile() && path.extname(item.name).toLowerCase() === '.svg') {
            
            // 1. Extract the base service name
            const match = item.name.match(NAME_REGEX);
            if (!match || match.length < 3) {
                console.warn(`Skipping file: ${item.name}. Name format did not match the required pattern.`);
                continue;
            }
            // Capture Group 2 contains the raw service name (e.g., 'ML Studio +')
            const rawServiceName = match[2]; 
            
            // 2. Clean the service name
            const serviceName = cleanSlug(rawServiceName); 
            if (serviceName === '') continue; // Skip if service name cleans to nothing

            // 3. Combine category and service name (e.g., 'analytics-ml-studio')
            const iconID = category ? `${category}-${serviceName}` : serviceName;

            // 4. Read and extract the SVG body content
            const svgContent = await fs.readFile(fullPath, 'utf8');
            const bodyStart = svgContent.indexOf('>') + 1;
            const bodyEnd = svgContent.lastIndexOf('</svg>');
            const svgBody = svgContent.substring(bodyStart, bodyEnd).trim();

            if (svgBody) {
                iconPack.icons[iconID] = {
                    body: svgBody,
                    width: ICON_WIDTH,
                    height: ICON_HEIGHT,
                };
            }
        }
    }
}

// ... (buildIconPack function remains unchanged) ...

async function buildIconPack() {
    console.log(`Starting icon generation from: ${ICON_ROOT_FOLDER}...`);
    const iconPack = {
        prefix: ICON_PREFIX,
        icons: {}
    };

    try {
        await traverseAndExtractIcons(ICON_ROOT_FOLDER, iconPack, '');
        
        const iconCount = Object.keys(iconPack.icons).length;
        if (iconCount === 0) {
            console.error('❌ Failed to find any icons with the required naming convention.');
            return;
        }

        await fs.writeJson(OUTPUT_FILE, iconPack, { spaces: 4 });
        console.log(`\n✅ Successfully generated icon pack: ${OUTPUT_FILE}`);
        console.log(`   Total icons: ${iconCount}`);
        console.log(`   Use in Mermaid: fa:${ICON_PREFIX}-<category>-<icon-name>`);
        console.log(`   Example: fa:azure-analytics-ml-studio`);

    } catch (err) {
        console.error(`\n❌ Fatal Error during icon processing:`, err);
    }
}

buildIconPack();