// Nibble's functionality is extremely simple.

// definitions

let flavorcode_base = "https://flavortown.hackclub.com"

let gallery_pn = "/explore/gallery";

// get path name
function retrievePathName() {
    return console.log(location.pathname);
}

// are we in the gallery?
function isOnGallery() {
    return (location.pathname === gallery_pn)
}

// get project list
function returnProjectList() {
    return document.getElementsByClassName("project-card")
}

// filter out letter and char and keep num
function returnProjectId(project) {
    return project.id.replace(/\D/g, '');
}

// returns the frame that holds the ai stuff
function returnAiDeclarationHeader(customDoc) {
    return customDoc.getElementsByClassName("project-show-card__ai-declaration")[0]
}

// returns the frame that holds the banner img of each proj
function returnProjectBannerFrame(project) { // takes in project-card
    return project.getElementsByClassName("project-card__banner-frame")[0]
}

// create img/banner thing
function createImg(bannerframe, path) {
    bannerframe.style.position = 'relative';
    
    let img = document.createElement("img")
    img.src = path
    img.style = "position: absolute; top: 0; left: 0; width: auto; height: auto; object-fit: cover; z-index: 10;"
    bannerframe.appendChild(img)
    return img
}

//# API Stuff 

async function getProjectById(id) {
    try {
        const resp = await (fetch(`${flavorcode_base}/projects/${id}`, {
            headers: { "X-Flavortown-Ext-10584": "true" }
        }))
        if (!resp.ok) {
            throw new Error('request to api failed... did you hit the rate limit? xd');
        }
        const respd = await resp.text();
        return respd
    } catch (error) {
        console.error("Error?")
    }
}

const processedProjects = new Set();

function processProject(project) {
    let project_id = returnProjectId(project);
    
    if (processedProjects.has(project_id)) return;
    processedProjects.add(project_id);
    
    console.log(project_id);
    let bannerframe = returnProjectBannerFrame(project);
    
    if (!bannerframe) return;
    
    (async () => {
        const html = await getProjectById(project_id);
        if (!html) return;

        const dom = new DOMParser().parseFromString(html, "text/html");
        if (returnAiDeclarationHeader(dom)) {
            createImg(bannerframe, chrome.runtime.getURL("images/label.png"))
        }
    })();
}

function processExistingProjects() {
    for (const project of returnProjectList()) {
        processProject(project);
    }
}

function observeNewProjects() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.classList && node.classList.contains('project-card')) {
                    processProject(node);
                }
                if (node.nodeType === 1 && node.querySelectorAll) {
                    const projects = node.querySelectorAll('.project-card');
                    projects.forEach(processProject);
                }
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Main
processExistingProjects();
observeNewProjects();