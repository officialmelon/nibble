let flavorcode_base = "https://flavortown.hackclub.com"

let gallery_pn = "/explore/gallery"

function returnProjectList() {
    return document.getElementsByClassName("project-card")
}

function returnExplorePosts() {
    return document.getElementsByClassName("post__content")
}

function returnProjectId(project) {
    return project.id.replace(/\D/g, '')
}

function returnProjectIdFromExplore(post) {
    const link = post.querySelector('a[href^="/projects/"]')
    if (!link) return null
    const m = link.getAttribute("href").match(/\d+/)
    return m ? m[0] : null
}

function returnAiDeclarationHeader(customDoc) {
    return customDoc.getElementsByClassName("project-show-card__ai-declaration")[0]
}

function returnProjectBannerFrame(project) {
    return project.getElementsByClassName("project-card__banner-frame")[0]
}

function returnProjectBannerFrame_explore(post) {
    return post.querySelector(".post__attachments .post__viewport")
}

function createImg(bannerframe, path) {
    bannerframe.style.position = "relative"
    let img = document.createElement("img")
    img.src = path
    img.style = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:10;pointer-events:none;"
    bannerframe.appendChild(img)
    return img
}

async function getProjectById(id) {
    const resp = await fetch(`${flavorcode_base}/projects/${id}`, {
        headers: { "X-Flavortown-Ext-10584": "true" }
    })
    if (!resp.ok) return null
    return await resp.text()
}

const processedProjects = new Set()

function processGalleryProject(project) {
    let project_id = returnProjectId(project)
    if (!project_id || processedProjects.has(project_id)) return
    processedProjects.add(project_id)

    let bannerframe = returnProjectBannerFrame(project)
    if (!bannerframe) return

    ;(async () => {
        const html = await getProjectById(project_id)
        if (!html) return
        const dom = new DOMParser().parseFromString(html, "text/html")
        if (returnAiDeclarationHeader(dom)) {
            createImg(bannerframe, chrome.runtime.getURL("images/label.png"))
        }
    })()
}

function processExplorePost(post) {
    let project_id = returnProjectIdFromExplore(post)
    if (!project_id || processedProjects.has(project_id)) return
    processedProjects.add(project_id)

    let bannerframe = returnProjectBannerFrame_explore(post)
    if (!bannerframe) return

    ;(async () => {
        const html = await getProjectById(project_id)
        if (!html) return
        const dom = new DOMParser().parseFromString(html, "text/html")
        if (returnAiDeclarationHeader(dom)) {
            createImg(bannerframe, chrome.runtime.getURL("images/label.png"))
        }
    })()
}

function processExisting() {
    for (const project of returnProjectList()) {
        processGalleryProject(project)
    }
    for (const post of returnExplorePosts()) {
        processExplorePost(post)
    }
}

function observeNew() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue

                if (node.classList?.contains("project-card")) {
                    processGalleryProject(node)
                }

                if (node.classList?.contains("post__content")) {
                    processExplorePost(node)
                }

                node.querySelectorAll?.(".project-card").forEach(processGalleryProject)
                node.querySelectorAll?.(".post__content").forEach(processExplorePost)
            }
        }
    })

    observer.observe(document.body, { childList: true, subtree: true })
}

processExisting()
observeNew()
