const Report = require('../models/Report');
const Employee = require('../models/Employee');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');

const REPORT_POPULATE = [
  { path: 'reportedBy', select: 'name email role' },
  { path: 'reportedUser', select: 'name email role' },
  { path: 'reviewedBy', select: 'name email role' }
];

const isAdminRole = (role) => ['ADMIN', 'HR'].includes((role || '').toString().toUpperCase());

const paginate = ({ page = 1, limit = 10 }) => {
  const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const pageLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
  return {
    currentPage,
    pageLimit,
    skip: (currentPage - 1) * pageLimit
  };
};

const withStatus = (filter, status) => {
  if (!status) return filter;
  return { ...filter, status };
};

const getEmployeeReporterIds = async (organizationId) => {
  const employees = await Employee.find({
    organizationId,
    role: { $nin: ['ADMIN', 'HR', 'admin', 'hr'] }
  }).select('_id').lean();

  return employees.map((employee) => employee._id);
};

const sendReports = async (res, filter, query) => {
  const { currentPage, pageLimit, skip } = paginate(query);

  const reports = await Report.find(filter)
    .populate(REPORT_POPULATE)
    .sort({ createdAt: -1 })
    .limit(pageLimit)
    .skip(skip);

  const total = await Report.countDocuments(filter);

  return res.status(200).json({
    reports,
    totalPages: Math.ceil(total / pageLimit),
    currentPage,
    total
  });
};

// Create a new report
const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description, severity, anonymous, evidence } = req.body;
    const reportedBy = req.user.id;
    const organizationId = req.organizationId;

    if (isAdminRole(req.role)) {
      return res.status(403).json({ message: 'Admins are not allowed to file reports' });
    }

    if (!reportedUserId || !reason || !description) {
      return res.status(400).json({
        message: 'Reported user, reason, and description are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reportedUserId)) {
      return res.status(400).json({ message: 'Invalid reported user' });
    }

    // Check if reported user exists and belongs to same organization
    const reportedUser = await Employee.findOne({
      _id: reportedUserId,
      organizationId: organizationId
    });

    if (!reportedUser) {
      return res.status(404).json({ message: 'Reported user not found' });
    }

    // Check if user is not reporting themselves
    if (reportedUserId === reportedBy) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    // Map evidence type for model compliance
    const mappedEvidence = (evidence || []).map(item => ({
      evidenceType: item.type || 'image',
      url: item.url
    }));

    const report = new Report({
      organization: organizationId,
      reportedBy,
      reportedUser: reportedUserId,
      reason,
      description,
      severity: severity || 'medium',
      anonymous: anonymous || false,
      evidence: mappedEvidence
    });

    console.log('Attempting to save report with evidence count:', mappedEvidence.length);
    await report.save();
    console.log('Report saved successfully:', report._id);

    const populatedReport = await Report.findById(report._id)
      .populate(REPORT_POPULATE);

    // Automatically create a chat thread linked to the report
    const chat = new Chat({
      organization: organizationId,
      participants: [reportedBy],
      isAdminChat: true,
      isGroupChat: false,
      linkedReport: report._id
    });
    await chat.save();

    res.status(201).json(populatedReport);
  } catch (error) {
    console.error('CRITICAL ERROR in createReport:', error);
    res.status(500).json({ 
      message: 'Server error while creating report', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all reports (for admin)
const getAllReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const organizationId = req.organizationId;
    const currentUserId = req.user.id;

    if (!isAdminRole(req.role)) {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const employeeReporterIds = await getEmployeeReporterIds(organizationId);
    const filter = withStatus({
      organization: organizationId,
      reportedBy: { $in: employeeReporterIds, $ne: currentUserId }
    }, status);

    return sendReports(res, filter, { page, limit });
  } catch (error) {
    console.error('Error in getAllReports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reports filed by current user
const getMyReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const reportedBy = req.user.id;
    const organizationId = req.organizationId;

    if (isAdminRole(req.role)) {
      return res.status(200).json({
        reports: [],
        totalPages: 0,
        currentPage: Number.parseInt(page, 10) || 1,
        total: 0
      });
    }

    const filter = withStatus({
      organization: organizationId,
      reportedBy
    }, status);

    return sendReports(res, filter, { page, limit });
  } catch (error) {
    console.error('Error in getMyReports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get reports against current user
const getReportsAgainstMe = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const reportedUser = req.user.id;
    const organizationId = req.organizationId;

    const filter = withStatus({
      organization: organizationId,
      reportedUser
    }, status);

    return sendReports(res, filter, { page, limit });
  } catch (error) {
    console.error('Error in getReportsAgainstMe:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update report status (only by the one who reported it)
const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, reviewNotes, resolution } = req.body;
    const currentUserId = req.user.id;

    if (isAdminRole(req.role)) {
      return res.status(403).json({ message: 'Admins are not allowed to update report status' });
    }

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: 'Invalid report id' });
    }

    const report = await Report.findOne({
      _id: reportId,
      organization: req.organizationId
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify ownership: Only the original reporter can update the status
    if (report.reportedBy.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Only the original reporter can update the status of this report' });
    }

    if (!['pending', 'under_review', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    report.status = status;
    report.reviewedBy = currentUserId;
    report.reviewNotes = reviewNotes || report.reviewNotes;

    if (resolution) {
      report.resolution = resolution;
    }

    if (status === 'resolved' || status === 'dismissed') {
      report.resolutionDate = new Date();
    }

    await report.save();

    const updatedReport = await Report.findById(reportId)
      .populate(REPORT_POPULATE);

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error('Error in updateReportStatus:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get report statistics (for admin)
const getReportStats = async (req, res) => {
  try {
    const { organizationId } = req;
    
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    if (!isAdminRole(req.role)) {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const employeeReporterIds = await getEmployeeReporterIds(organizationId);
    const filter = {
      organization: organizationId,
      reportedBy: { $in: employeeReporterIds, $ne: req.user.id }
    };

    const pendingCount = await Report.countDocuments({ ...filter, status: 'pending' });
    const underReviewCount = await Report.countDocuments({ ...filter, status: 'under_review' });
    const resolvedCount = await Report.countDocuments({ ...filter, status: 'resolved' });
    const dismissedCount = await Report.countDocuments({ ...filter, status: 'dismissed' });

    res.status(200).json({
      statusStats: [
        { _id: 'pending', count: pendingCount },
        { _id: 'under_review', count: underReviewCount },
        { _id: 'resolved', count: resolvedCount },
        { _id: 'dismissed', count: dismissedCount }
      ]
    });
  } catch (error) {
    console.error('Error in getReportStats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getMyReports,
  getReportsAgainstMe,
  updateReportStatus,
  getReportStats
};
