const Page = require('../models/pageModel'); // for db op on page data
const Workspace = require('../models/workspaceModel')
const Block = require('../models/blockModel')
const asyncHandler = require('express-async-handler');

// @desc Get a single page by id
// @route GET /pages/:id
// @access private
const getPage = asyncHandler(async(req,res)=>{
    const id = req.params.id;
    const page = await Page.findById(id);
    if(!page){
        res.status(404);
        throw new Error('No Page Found');
    }
    if(page.createdBy.toString() !== req.user._id.toString()){
        res.status(403);
        throw new Error('Not Authorized');
    }
    return res.status(200).json(page);
});


// @desc Get all pages for the authenticated user (optionally by workspace)
// @route GET /pages?workspaceId=<workspaceId>
// @access private
const getAllPages = asyncHandler(async(req,res)=>{
    const filter = { createdBy: req.user._id };

    if (req.query.workspaceId) {
        const workspace = await Workspace.findOne({
            _id: req.query.workspaceId,
            owner: req.user._id,
        });

        if (!workspace) {
            res.status(404);
            throw new Error('Workspace not found');
        }

        filter.workspace = workspace._id;
    }

    // The profile menu uses this query to fetch only pages the user explicitly starred.
    if (req.query.starred === 'true') filter.isStarred = true;

    const pages = await Page.find(filter).sort({ updatedAt: -1 });
    //only returns the pages of that user who is logged in  and what the workspace he need
    return res.status(200).json(pages);
})


// @desc Create a new page
// @route POST /pages
// @access private
const createPage = asyncHandler(async(req,res)=>{
    const title = req.body.title?.trim();
    if (!title) {
        res.status(400);
        throw new Error('Page title is required');
    }

    const workspace = await Workspace.findOne({
        _id: req.body.workspace,
        owner: req.user._id,
    });

    if (!workspace) {
        res.status(404);
        throw new Error('Workspace not found');
    }

    const createdPage = await Page.create({
        title,
        workspace:workspace._id,
        // we are not using blocks here cause mongoose by default will assing the array
        createdBy:req.user._id
    });
    await Workspace.findByIdAndUpdate(
        workspace._id,
        {$push:{pages:createdPage._id}} // data adding already existed array 
    )
    return res.status(201).json(createdPage)
});

// @desc Update a page title
// @route PUT /pages/:id
// @access private
const updatePage = asyncHandler(async(req,res)=>{
    const id = req.params.id; // page id given by user as params
    const page = await Page.findById(id);
    if(!page){
        res.status(404);
        throw new Error("Invalid credentials");
    }
    if(page.createdBy.toString() !== req.user._id.toString()){
        // checking authorization
       res.status(403);
       throw new Error("You are not authorized to access this page");
    }
    const title = req.body.title?.trim();
    if (!title) {
        res.status(400);
        throw new Error('Page title is required');
    }
    const updatedPage = await Page.findByIdAndUpdate(
        id,
        {title},
        {new:true}
    );
     return res.status(200).json(updatedPage)
})

// Toggles a page's saved/starred state without changing its title or contents.
const toggleStarredPage = asyncHandler(async (req, res) => {
    const page = await Page.findById(req.params.id);
    if (!page) {
        res.status(404);
        throw new Error('Page not found');
    }
    if (page.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You are not authorized to update this page');
    }
    page.isStarred = !page.isStarred;
    await page.save();
    return res.status(200).json(page);
});

// Makes a page available in the public blog, or returns it to private mode.
const togglePageSharing = asyncHandler(async (req, res) => {
    const page = await Page.findById(req.params.id);
    if (!page) { res.status(404); throw new Error('Page not found'); }
    if (page.createdBy.toString() !== req.user._id.toString()) { res.status(403); throw new Error('You are not authorized to share this page'); }
    if (page.blogStatus === 'suspended') { res.status(403); throw new Error('This blog has been suspended by an administrator'); }
    page.isShared = !page.isShared;
    await page.save();
    return res.status(200).json(page);
});

// Public readers only see posts that the author shared and an administrator has not suspended.
const getPublicPages = asyncHandler(async (_req, res) => {
    const pages = await Page.find({ isShared: true, blogStatus: 'published' })
        .select('title createdBy createdAt updatedAt')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 });
    return res.status(200).json(pages);
});

const getPublicPage = asyncHandler(async (req, res) => {
    const page = await Page.findOne({ _id: req.params.id, isShared: true, blogStatus: 'published' }).populate('createdBy', 'name');
    if (!page) { res.status(404); throw new Error('Blog post not found'); }
    const blocks = await Block.find({ page: page._id }).sort({ order: 1 });
    return res.status(200).json({ page, blocks });
});
// @desc Delete a page
// @route DELETE /pages/:id
// @access private
const deletePage = asyncHandler(async(req,res)=>{
    const id = req.params.id; // page id given by user as params
    const page = await Page.findById(id);
    if(!page){
        res.status(404);
        throw new Error("Invalid credentials");
    }
    if(page.createdBy.toString() !== req.user._id.toString()){
        // checking authorization
       res.status(403);
       throw new Error("You are not authorized to access this page");
    }
    await Block.deleteMany({ page: id });
    await Page.findByIdAndDelete(id);
    await Workspace.findByIdAndUpdate(
        page.workspace,
        { $pull: { pages: id } }
    )
     return res.status(200).json({message:"Page deleted"})
})

module.exports = {getPage,getAllPages,createPage,updatePage,toggleStarredPage,togglePageSharing,getPublicPages,getPublicPage,deletePage  }
