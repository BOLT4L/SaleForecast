import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { reportService } from "../../services/reportService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/Dialog";
import ReportGenerator from "./ReportGenerator";
import ReportList from "./ReportList";
import type { ReportInput } from "../../types/report";

const Reports = () => {
  const { user } = useAuth();
  const canGenerateReports = ["Manager", "Planner", "Owner"].includes(
    user?.role || ""
  );
  const [showGenerator, setShowGenerator] = useState(false);

  const {
    data: reports,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportService.getReports(),
    enabled: !!user,
  });

  const handleGenerateReport = async (reportData: ReportInput) => {
    try {
      console.log("Generating report with data:", reportData); // Debug log

      const result = await reportService.generateReport(reportData); // Call the actual API
      console.log("Report generated successfully:", result);

      setShowGenerator(false);
      refetch(); // Refetch reports only after success
    } catch (error) {
      console.error("Failed to generate report:", error);
      // Optionally show a toast or error message to the user
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive sales and analytics reports
          </p>
        </div>
        {canGenerateReports && (
          <Button onClick={() => setShowGenerator(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportList reports={reports || []} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
          </DialogHeader>
          <ReportGenerator
            onSuccess={handleGenerateReport}
            onCancel={() => setShowGenerator(false)}
            isLoading={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
