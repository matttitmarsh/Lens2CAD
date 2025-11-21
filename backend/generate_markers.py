import cv2
import numpy as np

def generate_a4_marker_sheet(output_file="marker_sheet_a4.png"):
    # A4 dimensions at 300 DPI
    dpi = 300
    width_mm = 210
    height_mm = 297
    
    width_px = int(width_mm / 25.4 * dpi)
    height_px = int(height_mm / 25.4 * dpi)
    
    # Create white image
    image = np.ones((height_px, width_px), dtype=np.uint8) * 255
    
    # Load ArUco dictionary
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    
    # Marker size in mm
    marker_size_mm = 30
    marker_size_px = int(marker_size_mm / 25.4 * dpi)
    
    # Margins
    margin_mm = 20
    margin_px = int(margin_mm / 25.4 * dpi)
    
    # Positions for 4 markers (TL, TR, BL, BR)
    # IDs: 0, 1, 2, 3
    positions = [
        (margin_px, margin_px), # TL
        (width_px - margin_px - marker_size_px, margin_px), # TR
        (margin_px, height_px - margin_px - marker_size_px), # BL
        (width_px - margin_px - marker_size_px, height_px - margin_px - marker_size_px) # BR
    ]
    
    ids = [0, 1, 2, 3]
    
    for i, pos in enumerate(positions):
        marker_img = cv2.aruco.generateImageMarker(aruco_dict, ids[i], marker_size_px)
        x, y = pos
        image[y:y+marker_size_px, x:x+marker_size_px] = marker_img
        
    # Text removed as per user request
    pass
    
    cv2.imwrite(output_file, image)
    print(f"Generated {output_file}")
    
    # Generate PDF
    pdf_file = output_file.replace(".png", ".pdf")
    import img2pdf
    
    # A4 size in mm
    a4inpt = (img2pdf.mm_to_pt(210), img2pdf.mm_to_pt(297))
    layout_fun = img2pdf.get_layout_fun(a4inpt)
    
    with open(pdf_file, "wb") as f:
        f.write(img2pdf.convert(output_file, layout_fun=layout_fun))
    print(f"Generated {pdf_file}")

if __name__ == "__main__":
    generate_a4_marker_sheet()
