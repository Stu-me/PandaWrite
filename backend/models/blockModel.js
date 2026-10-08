const mongoose = require('mongoose');

const blockSchema = mongoose.Schema({
    type:{ // what type of data in the block 
        type:String,
        required:true,
        enum:['text','heading','todo','image','audio','youtube','document']
    },
    order:{ 
        type:Number,
        required:true
    },
    page:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Page', // page stores the id that is of the page model
        required:true,
    },
    content:{
        type:String,
    },
    // Stores presentation metadata (heading level, text colour, and writing style) separately from the content.
    properties: { type: mongoose.Schema.Types.Mixed, default: {} },
},
{
    timestamps:true
})

// Supports ordered block reads and free-tier block counting for a page.
blockSchema.index({ page: 1, order: 1 });

 // every piece of information on the page is block
module.exports = mongoose.model('Block',blockSchema);
