const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportGroupSchema = new Schema({
    reported_id: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    status: {
        type: Boolean,
        enum : [true, false],
        default: true
    },
    reportedGroup_id: {
        type: Schema.Types.ObjectId,
        ref: 'groups'
    },
    comment:{
        type: String,
        default: null
    }
}, {
    timestamps: true
}
)
const reportGroup = mongoose.model("reportGroups", reportGroupSchema);
module.exports = reportGroup;