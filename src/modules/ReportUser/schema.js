const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    reported_id: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    status: {
        type: Boolean,
        enum : [true, false],
        default: true
    },
    reportedBy_id: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    comment:{
        type: String,
        default: null
    }
}, {
    timestamps: true
}
)
const report = mongoose.model("reports", reportSchema);
module.exports = report;