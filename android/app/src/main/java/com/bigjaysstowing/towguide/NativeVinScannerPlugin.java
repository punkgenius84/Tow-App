package com.bigjaysstowing.towguide;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.Task;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import com.google.mlkit.vision.common.InputImage;
import com.google.android.gms.code.scanner.GmsBarcodeScanner;
import com.google.android.gms.code.scanner.GmsBarcodeScannerOptions;
import com.google.android.gms.code.scanner.GmsBarcodeScanning;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "NativeVinScanner")
public class NativeVinScannerPlugin extends Plugin {

    @PluginMethod
    public void scanBarcode(PluginCall call) {
        int formats = Barcode.FORMAT_CODE_39
            | Barcode.FORMAT_CODE_128
            | Barcode.FORMAT_DATA_MATRIX
            | Barcode.FORMAT_PDF417
            | Barcode.FORMAT_QR_CODE
            | Barcode.FORMAT_ITF;

        GmsBarcodeScannerOptions options = new GmsBarcodeScannerOptions.Builder()
            .setBarcodeFormats(formats)
            .enableAutoZoom()
            .build();

        GmsBarcodeScanner scanner = GmsBarcodeScanning.getClient(getContext(), options);
        scanner.startScan()
            .addOnSuccessListener(barcode -> {
                JSObject result = new JSObject();
                result.put("rawValue", barcode.getRawValue());
                result.put("format", barcode.getFormat());
                call.resolve(result);
            })
            .addOnCanceledListener(() -> call.reject("Barcode scan cancelled."))
            .addOnFailureListener(error -> call.reject(
                "Barcode scanner failed: " + error.getMessage(), error
            ));
    }

    @PluginMethod
    public void recognizeText(PluginCall call) {
        String encoded = call.getString("imageBase64");
        if (encoded == null || encoded.trim().isEmpty()) {
            call.reject("No image was supplied for VIN recognition.");
            return;
        }

        TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        try {
            byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
            if (bitmap == null) {
                recognizer.close();
                call.reject("The selected photo could not be decoded.");
                return;
            }

            InputImage image = InputImage.fromBitmap(bitmap, 0);
            recognizer.process(image)
                .addOnSuccessListener(text -> {
                    JSObject result = new JSObject();
                    result.put("text", text.getText());
                    call.resolve(result);
                })
                .addOnFailureListener(error -> call.reject(
                    "Android text recognition failed: " + error.getMessage(), error
                ))
                .addOnCompleteListener(task -> {
                    recognizer.close();
                    bitmap.recycle();
                });
        } catch (Exception error) {
            recognizer.close();
            call.reject("Could not prepare the photo for recognition: " + error.getMessage(), error);
        }
    }
}
