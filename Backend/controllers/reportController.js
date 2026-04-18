const Report = require('../models/Report');
const Employee = require('../models/Employee');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');

// Create a new report
const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description, severity, anonymous, evidence } = req.body;
    const reportedBy = req.user.id;
    const organizationId = req.organizationId;

    if (!reportedUserId || !reason || !description) {
      return res.status(400).json({
        message: 'Reported user, reason, and description are required'
      });
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
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reviewedBy', 'name email');

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
    console.log("getAllReports: organizationId ->", organizationId);

    const filter = { organization: organizationId };
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
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

    const filter = {
      organization: organizationId,
      reportedBy
    };
    console.log("getMyReports: filter ->", filter);
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
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

    const filter = {
      organization: organizationId,
      reportedUser
    };
    if (status) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
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
    const userRole = req.role;

    if (userRole === 'ADMIN' || userRole === 'HR') {
      return res.status(403).json({ message: 'Admin/HR not authorized to update report status' });
    }

    const report = await Report.findById(reportId);

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
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reviewedBy', 'name email');

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

    const filter = { organization: organizationId };

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
