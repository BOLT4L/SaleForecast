import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { Eye, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { reportService } from "../../services/reportService";
import { Button } from "../../components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import ReportDetails from "./ReportDetails";
import type { Report } from "../../types/report";

interface ReportListProps {
  reports: Report[];
  isLoading: boolean;
}

const ReportList = ({ reports, isLoading }: ReportListProps) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const downloadMutation = useMutation({
    mutationFn: reportService.downloadReport,
    onSuccess: (blob, reportId) => {
      const report = reports.find((r) => r._id === reportId);
      if (!report) {
        toast.error("Report not found");
        return;
      }
      try {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${report.reportType}_${report._id}.${report.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Report downloaded successfully");
      } catch (error: any) {
        console.error("Error creating download URL:", error.message);
        toast.error("Failed to initiate download");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to download report");
    },
  });

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setShowDetails(true);
  };

  const handleDownload = (report: Report) => {
    downloadMutation.mutate(report._id);
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) {
      console.warn("Missing date string");
      return "N/A";
    }
    try {
      const parsedDate = parseISO(dateStr);
      if (!isValid(parsedDate)) {
        console.warn(`Invalid date: ${dateStr}`);
        return "Invalid Date";
      }
      return format(parsedDate, "MMM dd, yyyy");
    } catch (error) {
      console.warn(`Error parsing date: ${dateStr}`, error);
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-12 bg-muted animate-pulse rounded"
          />
        ))}
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold">No reports found</h3>
        <p className="text-muted-foreground">
          Generate a new report to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Range</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report._id}>
                <TableCell>
                  {report.dateRange
                    ? `${formatDate(report.dateRange.startDate)} - ${formatDate(
                        report.dateRange.endDate
                      )}`
                    : "N/A"}
                </TableCell>
                <TableCell>{report.reportType || "Unknown"}</TableCell>
                <TableCell>{report.format?.toUpperCase() || "N/A"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(report.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(report)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report)}
                      disabled={downloadMutation.isPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && <ReportDetails report={selectedReport} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportList;
