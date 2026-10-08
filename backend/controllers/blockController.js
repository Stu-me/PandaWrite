const Page = require("../models/pageModel");
const Block = require("../models/blockModel");
const asyncHandler = require("express-async-handler");

// Ensures embeds point to web URLs instead of unsupported or unsafe URL schemes.
const validateEmbedContent = (type, content) => {
  if (!['image', 'youtube', 'document'].includes(type) || !content) return;
  try {
    const url = new URL(content);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL protocol');
  } catch {
    const label = type === 'youtube' ? 'YouTube' : type === 'document' ? 'Document' : 'Image';
    const error = new Error(`${label} blocks require a valid http(s) URL`);
    error.statusCode = 400;
    throw error;
  }
};

// @desc Get all blocks for a page
// @route GET /pages/:pageId/blocks
// @access private
const getAllBlocks = asyncHandler(async (req, res) => {
  const pageId = req.params.pageId; // gives pageId to return all the blocks
  // we well check if the pageId exists
  const page = await Page.findById(pageId);
  if (!page) {
    res.status(404);
    throw new Error("Page not found ");
  }
  if (page.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Forbidden to access");
  }
  // we have the page now we will bring out all the blocks ids data from the
  // block array present in that page
  // go straight to Block collection — sort by order field for correct display sequence
  const blocks = await Block.find({ page: pageId }).sort({ order: 1 }); // here 1 means acending order
  res.status(200).json(blocks);
});

// @desc Create a block on a page
// @route POST /pages/:pageId/blocks
// @access private
const createBlock = asyncHandler(async (req, res) => {
  const pageId = req.params.pageId;
  const page = await Page.findById(pageId);
  if (!page) {
    res.status(404);
    throw new Error("Page not found ");
  }
  if (page.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Forbidden to access");
  }
  const cntDocument = page.blocks.length;
  try {
    validateEmbedContent(req.body.type, req.body.content);
  } catch (error) {
    res.status(400);
    throw error;
  }
  const createdBlock = await Block.create({
    type: req.body.type,
    page: pageId,
    order: cntDocument,
    content: req.body.content,
    properties: req.body.properties || {},
  });
  await Page.findByIdAndUpdate(pageId, { $push: { blocks: createdBlock._id } });
  return res.status(201).json(createdBlock);
});

// @desc Update a block
// @route PUT /blocks/:id
// @access private
const updateBlock = asyncHandler(async (req, res) => {
  const blockId = req.params.id;
  const block = await Block.findById(blockId);
  if (!block) {
    res.status(404);
    throw new Error("Block not found");
  }
  const pageId = block.page;
  const page = await Page.findById(pageId); // should check if page exists first
  if (!page) {
    res.status(404);
    throw new Error("Invaid pageId");
  }
  if (page.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You dont have access to this page");
  }
  try {
    validateEmbedContent(req.body.type, req.body.content);
  } catch (error) {
    res.status(400);
    throw error;
  }
  const updatedBlock = await Block.findByIdAndUpdate(
    blockId,
    { content: req.body.content, type: req.body.type, properties: req.body.properties || {} },
    { new: true },
  );
  res.status(200).json(updatedBlock);
});
// @desc Delete a block
// @route DELETE /blocks/:id
// @access private
const deleteBlock = asyncHandler(async (req, res) => {
  const blockId = req.params.id;
  //check if the block exists
  const block = await Block.findById(blockId);
  if (!block) {
    res.status(404);
    throw new Error("Block not found");
  }
  const pageId = block.page;
  // check if the page exists
  const page = await Page.findById(pageId);
  if (!page) {
    res.status(404);
    throw new Error("Page not found ");
  }
  // mow we will check if the page owner and the user both are same
  if (page.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }
  // removing the blockId from the block array present in page
  await Page.findByIdAndUpdate(pageId, { $pull: { blocks: blockId } });
  //deleteing the block record from Block
  await Block.findByIdAndDelete(blockId);
  return res.status(200).json({ message: "block deleted" });
});

// @desc Reorder blocks within a page
// @route PUT /pages/:pageId/blocks/reorder
// @access private
const reorderBlock = asyncHandler(async (req, res) => {
  const pageId = req.params.pageId;
  const { blocks } = req.body;
  //check if pageId is valid
  const page = await Page.findById(pageId);
  if (!page) {
    res.status(404);
    throw new Error("PageId invalid");
  }
  // check that page belongs to user
  if (page.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Page donot belongs to you");
  }
  // validate input
  if (!Array.isArray(blocks) || blocks.length === 0) {
    // checks that blocks is array and not empty
    res.status(400);
    throw new Error("Invalid block array");
  }
  //fetch valid blocks for this page
  const existingBlocks = await Block.find({ page: pageId }).select("_id");

  const existingIds = new Set(existingBlocks.map((b) => b._id.toString())); // take blocks id from existing blocks

  // check if all ids belongs to this page and not any other page
  // checks that all the ids from req.body belongs to existingids

  for (let id of blocks) {
    if (!existingIds.has(id)) {
      res.status(400);
      throw new Error("Invalid blockId in request");
    }
  }
  // duplicate check
  const uniqueIds = new Set(blocks);
  if (uniqueIds.size !== blocks.length) {
    res.status(400);
    throw new Error("Duplicate block IDs not allowed");
  };
  // check if all blocks are thier 
  if (blocks.length !== existingIds.size) {
    res.status(400);
    throw new Error('Missing blocks in reorder request');
}

  //updating multiple document in one time without db call again and again
  const updates = blocks.map((blockId, index) => ({
    updateOne: {
      filter: { _id: blockId, page: pageId },
      update: { $set: { order: index } },
    },
  }));
  await Block.bulkWrite(updates, { ordered: false });
  res.status(200).json({ message: "Blocks reordered successfully" });
});

module.exports = {
  getAllBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlock,
};
