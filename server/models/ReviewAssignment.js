const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewAssignmentSchema = new Schema({
  // Giảng viên được phân công chấm phản biện
  reviewerTeacher: [{
    type: Schema.Types.ObjectId,
    ref: "profileTeacher",
    required: true,
  }],
  // CouncilTeacher: {
  //   type: Schema.Types.ObjectId,
  //   ref: "profileTeacher",
  //   required: false,
  // },

  // posterTeacher: {
  //   type: Schema.Types.ObjectId,
  //   ref: "profileTeacher",
  //   required: false,
  // },

  // Nhóm sinh viên được chấm phản biện
  studentGroup: {
    type: Schema.Types.ObjectId,
    ref: "studentgroups",
    required: true,
  },

  // Đề tài được chấm phản biện
  topic: {
    type: Schema.Types.ObjectId,
    ref: "topics",
    required: true,
  },

  assignedDate: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ["Chờ chấm điểm", "Đã chấm điểm"],
    default: "Chờ chấm điểm",
  },
});

module.exports = mongoose.model("reviewAssignments", ReviewAssignmentSchema);
