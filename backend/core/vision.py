import cv2
import numpy as np
import ezdxf
import svgwrite
import os
from typing import List, Tuple, Optional, Dict
from rembg import remove, new_session

class ShapeScanner:
    def __init__(self):
        # A4 dimensions in mm
        self.A4_WIDTH_MM = 210
        self.A4_HEIGHT_MM = 297
        # ArUco dictionary
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
        self.aruco_params = cv2.aruco.DetectorParameters()
        self.detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
        
        # Initialize rembg session lazily
        self.rembg_session = None
        
        # Marker positions on the A4 sheet (mm) relative to top-left
        # Margins were 20mm, marker size 30mm
        margin = 20
        size = 30
        w = self.A4_WIDTH_MM
        h = self.A4_HEIGHT_MM
        
        # Centers of the markers
        # ID 0: TL
        # ID 1: TR
        # ID 2: BL
        # ID 3: BR
        self.ref_points = np.array([
            [margin + size/2, margin + size/2],           # TL (0)
            [w - margin - size/2, margin + size/2],       # TR (1)
            [margin + size/2, h - margin - size/2],       # BL (2)
            [w - margin - size/2, h - margin - size/2]    # BR (3)
        ], dtype=np.float32)

    def detect_markers(self, image: np.ndarray) -> Tuple[Optional[List], Optional[np.ndarray]]:
        """Detect ArUco markers in the image."""
        corners, ids, rejected = self.detector.detectMarkers(image)
        return corners, ids

    def correct_perspective(self, image: np.ndarray, corners: List, ids: np.ndarray) -> Tuple[Optional[np.ndarray], float]:
        """
        Warp perspective to top-down view of A4 sheet.
        Returns warped image and pixels_per_mm scale.
        """
        if ids is None or len(ids) < 4:
            print("Not enough markers found")
            return None, 0.0

        ids = ids.flatten()
        src_points = np.zeros((4, 2), dtype=np.float32)
        found_count = 0
        
        for i, marker_id in enumerate(ids):
            if marker_id in [0, 1, 2, 3]:
                c = corners[i][0]
                center = np.mean(c, axis=0)
                src_points[marker_id] = center
                found_count += 1
        
        if found_count < 4:
            print(f"Only found {found_count} reference markers")
            return None, 0.0

        # Destination points (pixels)
        # Restored high resolution scale (10.0 px/mm) for Hugging Face Spaces (16GB RAM)
        scale = 10.0 # pixels per mm
        dst_width = int(self.A4_WIDTH_MM * scale)
        dst_height = int(self.A4_HEIGHT_MM * scale)
        
        dst_points = self.ref_points * scale
        
        H, mask = cv2.findHomography(src_points, dst_points)
        warped = cv2.warpPerspective(image, H, (dst_width, dst_height))
        
        return warped, scale

    def extract_contours(self, image: np.ndarray) -> List[np.ndarray]:
        """
        Extract contours from the warped image using rembg for AI-based segmentation.
        """
        
        # Remove background
        # Lazy load the session if not already initialized
        if self.rembg_session is None:
            print("Initializing rembg session (u2net)...")
            # Switched back to standard 'u2net' model for better quality
            self.rembg_session = new_session("u2net")
            
        # Use the pre-initialized session
        output = remove(image, session=self.rembg_session)
        
        # Extract alpha channel
        if output.shape[2] == 4:
            alpha = output[:, :, 3]
        else:
            print("Warning: rembg output does not have 4 channels.")
            return []

        # Threshold the alpha channel to get a binary mask
        ret, mask = cv2.threshold(alpha, 127, 255, cv2.THRESH_BINARY)
        
        # Mask out the markers and borders
        safety_mask = np.ones(mask.shape, dtype=np.uint8) * 255
        
        # 1. Mask borders
        border_mm = 5
        scale = 10.0 
        border_px = int(border_mm * scale)
        h, w = mask.shape
        cv2.rectangle(safety_mask, (0, 0), (w, border_px), 0, -1) 
        cv2.rectangle(safety_mask, (0, h-border_px), (w, h), 0, -1) 
        cv2.rectangle(safety_mask, (0, 0), (border_px, h), 0, -1) 
        cv2.rectangle(safety_mask, (w-border_px, 0), (w, h), 0, -1) 
        
        # 2. Mask markers
        marker_size_mm = 30
        margin_mm = 20
        padding_mm = 5
        mask_size_px = int((marker_size_mm + padding_mm * 2) * scale)
        
        marker_tls_mm = [
            (margin_mm - padding_mm, margin_mm - padding_mm),
            (self.A4_WIDTH_MM - margin_mm - marker_size_mm - padding_mm, margin_mm - padding_mm),
            (margin_mm - padding_mm, self.A4_HEIGHT_MM - margin_mm - marker_size_mm - padding_mm),
            (self.A4_WIDTH_MM - margin_mm - marker_size_mm - padding_mm, self.A4_HEIGHT_MM - margin_mm - marker_size_mm - padding_mm)
        ]
        
        for x_mm, y_mm in marker_tls_mm:
            x_px = int(x_mm * scale)
            y_px = int(y_mm * scale)
            cv2.rectangle(safety_mask, (x_px, y_px), (x_px + mask_size_px, y_px + mask_size_px), 0, -1)
            
        # Apply safety mask
        mask = cv2.bitwise_and(mask, mask, mask=safety_mask)
        
        # Find contours
        contours, hierarchy = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter small contours (noise)
        min_area = 500 # Standard min area for 10.0 scale
        
        # Text zone filtering
        text_zone_y_center = self.A4_HEIGHT_MM / 2
        text_zone_height = 40 # mm
        text_zone_y_min = (text_zone_y_center - text_zone_height / 2) * scale
        text_zone_y_max = (text_zone_y_center + text_zone_height / 2) * scale
        
        valid_contours = []
        for c in contours:
            if cv2.contourArea(c) <= min_area:
                continue
                
            # Check if contour is inside text zone
            x, y, w, h = cv2.boundingRect(c)
            if y > text_zone_y_min and (y + h) < text_zone_y_max:
                continue
            
            valid_contours.append(c)
        
        # Simplify contours (Douglas-Peucker)
        simplified_contours = []
        for c in valid_contours:
            epsilon = 0.0005 * cv2.arcLength(c, True) 
            approx = cv2.approxPolyDP(c, epsilon, True)
            simplified_contours.append(approx)
            
        return simplified_contours

    def generate_svg(self, contours: List[np.ndarray], scale: float, filename: str, viewbox_size: Tuple[float, float] = None):
        """Generate SVG file from contours."""
        if viewbox_size:
            w_mm, h_mm = viewbox_size
        else:
            w_mm, h_mm = self.A4_WIDTH_MM, self.A4_HEIGHT_MM
            
        dwg = svgwrite.Drawing(filename, profile='tiny', size=(f"{w_mm}mm", f"{h_mm}mm"))
        dwg.viewbox(0, 0, w_mm, h_mm)
        
        for contour in contours:
            # Convert pixels to mm
            points_mm = contour.reshape(-1, 2) / scale
            # Create path
            path_data = "M " + " L ".join([f"{x},{y}" for x, y in points_mm]) + " Z"
            # Use a very thin stroke to avoid confusion with bounding box measurements
            dwg.add(dwg.path(d=path_data, fill="none", stroke="black", stroke_width=0.1))
            
        dwg.save()

    def generate_dxf(self, contours: List[np.ndarray], scale: float, filename: str):
        """Generate DXF file from contours."""
        doc = ezdxf.new()
        # Set units to Millimeters (4)
        doc.header['$INSUNITS'] = 4
        msp = doc.modelspace()
        
        for contour in contours:
            points_mm = contour.reshape(-1, 2) / scale
            # ezdxf expects list of (x, y) tuples
            points = [(float(p[0]), float(p[1])) for p in points_mm]
            # Add polyline, close it
            msp.add_lwpolyline(points, close=True)
            
        doc.saveas(filename)

    def process_image(self, image_bytes: bytes, output_dir: str) -> Dict:
        """
        Main processing pipeline.
        """
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return {"error": "Could not decode image"}

        try:
            # Detect markers
            corners, ids = self.detect_markers(image)
            
            # Correct perspective
            warped, scale = self.correct_perspective(image, corners, ids)
            
            if warped is None:
                return {"error": "Could not correct perspective (markers missing?)"}

            # Extract contours
            contours = self.extract_contours(warped)
            
            if not contours:
                 return {"error": "No object detected"}

            # Normalize coordinates to (0,0)
            # Find min_x and min_y across all contours
            all_points = np.vstack(contours).reshape(-1, 2)
            min_x, min_y = np.min(all_points, axis=0)
            max_x, max_y = np.max(all_points, axis=0)
            
            # Shift all contours
            normalized_contours = []
            for c in contours:
                # c is (N, 1, 2)
                c_shifted = c.copy()
                c_shifted[:, 0, 0] -= min_x
                c_shifted[:, 0, 1] -= min_y
                normalized_contours.append(c_shifted)
                
            # Calculate new dimensions for SVG viewbox
            width_mm = (max_x - min_x) / scale
            height_mm = (max_y - min_y) / scale
            
            # Add a small padding to the viewbox
            padding_mm = 5
            
            # Generate outputs
            base_filename = "output"
            svg_path = os.path.join(output_dir, f"{base_filename}.svg")
            dxf_path = os.path.join(output_dir, f"{base_filename}.dxf")
            
            # For SVG, we want to set the viewbox size to the object size
            self.generate_svg(normalized_contours, scale, svg_path, viewbox_size=(width_mm, height_mm))
            self.generate_dxf(normalized_contours, scale, dxf_path)

            return {
                "status": "success",
                "scale": scale,
                "contours_count": len(contours),
                "svg_path": svg_path,
                "dxf_path": dxf_path
            }
        except Exception as e:
            raise e
