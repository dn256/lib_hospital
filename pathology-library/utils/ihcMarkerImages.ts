export interface IhcReferenceImage {
  label: string
  tissue: string
  finding: string
  antibody: string
  imageUrl: string
  sourceUrl: string
  source: 'Human Protein Atlas'
  license: 'CC BY 4.0'
}

export interface IhcMarkerImagePair {
  note: string
  positive: IhcReferenceImage
  negative: IhcReferenceImage
  diagnosticGuide?: {
    title: string
    note: string
    url: string
  }
}

const hpa = (
  label: string,
  tissue: string,
  finding: string,
  antibody: string,
  imageUrl: string,
  genePage: string,
): IhcReferenceImage => ({
  label,
  tissue,
  finding,
  antibody,
  imageUrl,
  sourceUrl: genePage,
  source: 'Human Protein Atlas',
  license: 'CC BY 4.0',
})

const note = 'Ảnh mô người từ Human Protein Atlas dùng để học nhận biết tín hiệu và mô chứng. Đây không phải ảnh chuẩn để tự chấm điểm xét nghiệm dự báo hoặc để loại trừ chẩn đoán.'

export const IHC_MARKER_IMAGES: Record<string, IhcMarkerImagePair> = {
  alk: {
    note: 'Ảnh HPA minh họa biểu hiện ALK ở mô người bình thường bằng kháng thể HPA010694: tế bào thần kinh là vùng có biểu hiện, còn tế bào gan là vùng không phát hiện. Đây không phải clone D5F3 và không phải cặp ảnh chấm điểm ung thư phổi; hãy mở hướng dẫn FDA đi kèm để xem hình dương tính, âm tính và nhiễu của assay D5F3.',
    positive: hpa('Biểu hiện cao', 'Vỏ não', 'Tế bào thần kinh bắt màu bào tương và nhân; đây là biểu hiện mô tham chiếu của HPA, không phải tín hiệu tế bào u phổi.', 'HPA010694', 'https://images.proteinatlas.org/10694/26100_B_8_5_rna_selected.jpg', 'https://www.proteinatlas.org/ENSG00000171094-ALK/tissue'),
    negative: hpa('Không phát hiện', 'Gan', 'Không phát hiện biểu hiện ALK ở tế bào gan trong mẫu mô tham chiếu HPA.', 'HPA010694', 'https://images.proteinatlas.org/10694/26075_A_7_4_rna_selected.jpg', 'https://www.proteinatlas.org/ENSG00000171094-ALK/tissue'),
    diagnosticGuide: {
      title: 'Mở bộ ảnh đọc ALK D5F3 chính thức',
      note: 'Hướng dẫn FDA có hình dương tính, âm tính và các kiểu bắt màu cần loại trừ.',
      url: 'https://www.accessdata.fda.gov/cdrh_docs/pdf14/P140025C.pdf#page=9',
    },
  },
  er: {
    note,
    positive: hpa('Có biểu hiện', 'Tuyến vú', 'Tế bào tuyến bắt màu mức trung bình; tế bào mỡ và tế bào cơ-biểu mô không phát hiện.', 'CAB000037', 'https://images.proteinatlas.org/37/288_B_2_4.jpg', 'https://www.proteinatlas.org/ENSG00000091831-ESR1/tissue'),
    negative: hpa('Không phát hiện', 'Gan', 'Không phát hiện ở tế bào gan và tế bào đường mật trong mẫu tham chiếu.', 'CAB000037', 'https://images.proteinatlas.org/37/268_A_7_4.jpg', 'https://www.proteinatlas.org/ENSG00000091831-ESR1/tissue'),
  },
  her2: {
    note,
    positive: hpa('Biểu hiện mạnh', 'Ung thư vú', 'Tế bào u được HPA chú giải mức biểu hiện cao.', 'CAB000043', 'https://images.proteinatlas.org/43/1051_A_4_1.jpg', 'https://www.proteinatlas.org/ENSG00000141736-ERBB2/tissue'),
    negative: hpa('Không phát hiện', 'Mô mỡ', 'Không phát hiện ở tế bào mỡ trong mẫu tham chiếu.', 'CAB000043', 'https://images.proteinatlas.org/43/1054_B_3_8.jpg', 'https://www.proteinatlas.org/ENSG00000141736-ERBB2/tissue'),
  },
  ki67: {
    note,
    positive: hpa('Biểu hiện mạnh', 'Amidan', 'Nhân tế bào trung tâm mầm và biểu mô lát bắt màu mạnh; vùng ngoài trung tâm mầm bắt màu mức trung bình.', 'CAB000058', 'https://images.proteinatlas.org/58/155454_A_6_8.jpg', 'https://www.proteinatlas.org/ENSG00000148773-MKI67/tissue'),
    negative: hpa('Không phát hiện', 'Mô mỡ', 'Không phát hiện ở tế bào mỡ trong mẫu tham chiếu.', 'CAB000058', 'https://images.proteinatlas.org/58/155454_B_1_8.jpg', 'https://www.proteinatlas.org/ENSG00000148773-MKI67/tissue'),
  },
  ttf1: {
    note,
    positive: hpa('Biểu hiện mạnh', 'Phổi', 'Phế bào típ I và típ II bắt màu mạnh; nội mô và đại thực bào không phát hiện.', 'CAB000078', 'https://images.proteinatlas.org/78/1897_A_1_4.jpg', 'https://www.proteinatlas.org/ENSG00000136352-NKX2-1/tissue'),
    negative: hpa('Không phát hiện', 'Đại tràng', 'Không phát hiện ở biểu mô tuyến, nội mô và mô thần kinh ngoại biên trong mẫu tham chiếu.', 'CAB000078', 'https://images.proteinatlas.org/78/1897_A_7_3.jpg', 'https://www.proteinatlas.org/ENSG00000136352-NKX2-1/tissue'),
  },
  napsina: {
    note,
    positive: hpa('Có biểu hiện', 'Phổi', 'Phế bào bắt màu mức trung bình; đại thực bào bắt màu mạnh.', 'CAB009591', 'https://images.proteinatlas.org/9591/27119_A_1_4.jpg', 'https://www.proteinatlas.org/ENSG00000131400-NAPSA/tissue'),
    negative: hpa('Không phát hiện', 'Gan', 'Không phát hiện ở tế bào gan và tế bào đường mật trong mẫu tham chiếu.', 'CAB009591', 'https://images.proteinatlas.org/9591/27119_A_7_4.jpg', 'https://www.proteinatlas.org/ENSG00000131400-NAPSA/tissue'),
  },
  p40: {
    note,
    positive: hpa('Biểu hiện mạnh', 'Phế quản', 'Biểu mô hô hấp bắt màu mạnh trong mẫu tham chiếu.', 'CAB000083', 'https://images.proteinatlas.org/83/860_B_4_2.jpg', 'https://www.proteinatlas.org/ENSG00000073282-TP63/tissue'),
    negative: hpa('Không phát hiện', 'Gan', 'Không phát hiện ở tế bào gan và tế bào đường mật trong mẫu tham chiếu.', 'CAB000083', 'https://images.proteinatlas.org/83/860_A_9_4.jpg', 'https://www.proteinatlas.org/ENSG00000073282-TP63/tissue'),
  },
  pax8: {
    note,
    positive: hpa('Biểu hiện mạnh', 'Tuyến giáp', 'Tế bào tuyến bắt màu mạnh trong mẫu tham chiếu.', 'CAB055097', 'https://images.proteinatlas.org/55097/120596_B_2_5.jpg', 'https://www.proteinatlas.org/ENSG00000125618-PAX8/tissue'),
    negative: hpa('Không phát hiện', 'Gan', 'Không phát hiện ở tế bào gan và tế bào đường mật trong mẫu tham chiếu.', 'CAB055097', 'https://images.proteinatlas.org/55097/120596_A_8_4.jpg', 'https://www.proteinatlas.org/ENSG00000125618-PAX8/tissue'),
  },
  melana: {
    note,
    positive: hpa('Biểu hiện mạnh', 'Da', 'Tế bào hắc tố bắt màu mạnh; keratinocyte, tế bào Langerhans và nguyên bào sợi không phát hiện.', 'CAB000057', 'https://images.proteinatlas.org/57/155161_B_9_1.jpg', 'https://www.proteinatlas.org/ENSG00000120215-MLANA/tissue'),
    negative: hpa('Không phát hiện', 'Đại tràng', 'Không phát hiện ở biểu mô tuyến, nội mô và mô thần kinh ngoại biên trong mẫu tham chiếu.', 'CAB000057', 'https://images.proteinatlas.org/57/155161_A_7_3.jpg', 'https://www.proteinatlas.org/ENSG00000120215-MLANA/tissue'),
  },
}

export const HPA_IMAGE_METHOD_URL = 'https://www.proteinatlas.org/humanproteome/tissue/method/ih%2Bimaging'
export const HPA_LICENSE_URL = 'https://www.proteinatlas.org/about/licence'
