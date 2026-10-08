const mongoose = require('mongoose');

const pageSchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    workspace:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Workspace',
        required:true
    },
    blocks:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Block',
        // not required cause new page will have zero blocks
    }],
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    // Lets users build a persistent personal list of important pages.
    isStarred: { type: Boolean, default: false },
    // A shared page can be read from the public blog. Suspended posts are hidden from readers.
    isShared: { type: Boolean, default: false },
    blogStatus: { type: String, enum: ['published', 'suspended'], default: 'published' },
    suspendedAt: { type: Date },
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
},{
    timestamps:true
})

// Supports page listing and free-tier page counting for a workspace.
pageSchema.index({ createdBy: 1, workspace: 1 });
pageSchema.index({ createdBy: 1, isStarred: 1, updatedAt: -1 });
pageSchema.index({ isShared: 1, blogStatus: 1, updatedAt: -1 });

module.exports = mongoose.model('Page',pageSchema);
