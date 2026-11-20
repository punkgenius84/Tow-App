package com.bigjaysstowing.towguide;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import com.google.mlkit.vision.common.InputImage;

@CapacitorPlugin(name = "NativeVinScanner")
public class NativeVinScannerPlugin extends Plugin {

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

            // JS decodes the source image, draws the EXIF-oriented result to a canvas,
            // then exports a new JPEG. This bitmap is already upright: no extra rotation.
            InputImage image = InputImage.fromBitmap(bitmap, 0);
            recognizer.process(image)
                .addOnSuccessListener(getActivity(), text -> {
                    JSObject result = new JSObject();
                    result.put("text", text.getText());
                    call.resolve(result);
                })
                .addOnFailureListener(getActivity(), error ->
                    call.reject("Android text recognition failed: " + error.getMessage(), error))
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
