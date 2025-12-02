import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileText, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { salesService } from "../../services/salesService";
import { Alert, AlertDescription } from "../../components/ui/Alert";
import { Card, CardContent } from "../../components/ui/Card";
import { FileUpload } from "../../components/ui/FileUpload";

interface SalesUploadProps {
  onSuccess: () => void;
}

const SalesUpload = ({ onSuccess }: SalesUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      salesService.uploadSales(file, (progress) => setUploadProgress(progress)),
    onMutate: () => {
      setUploadStatus("uploading");
      setUploadProgress(0);
      setErrorMessage("");
    },
    onSuccess: () => {
      setUploadStatus("success");
      setUploadProgress(100);
      toast.success("Sales data uploaded successfully");
      onSuccess();
    },
    onError: (error: any) => {
      setUploadStatus("error");
      setErrorMessage(error.message || "Upload failed");
      toast.error(error.message || "Upload failed");
    },
  });

  const onFileSelect = (file: File) => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Upload Sales Data</h3>
        <p className="text-muted-foreground">
          Upload a CSV file containing your sales data. The file should include
          columns for date, total amount, items, and promotion status.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <FileUpload
            onFileSelect={onFileSelect}
            accept=".csv, .xls, .xlsx, .xml, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/xml"
            disabled={uploadStatus === "uploading"}
            className="w-full"
          />
          {uploadStatus === "uploading" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Uploading...
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {uploadProgress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Sales data uploaded successfully! The data has been processed and
            added to your sales records.
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          CSV Format Requirements
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • <strong>date:</strong> Date in YYYY-MM-DD format
          </li>
          <li>
            • <strong>total_amount:</strong> Total sale amount (decimal)
          </li>
          <li>
            • <strong>items:</strong> JSON array of items with productId,
            quantity, price, and promotion (e.g.,{" "}
            <code>
              [{"{"}productId":"123","quantity":2,"price":10,"promotion":false
              {"}"}]
            </code>
            )
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SalesUpload;
