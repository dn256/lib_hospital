export type IhcLocalization =
  | 'nuclear'
  | 'membranous'
  | 'cytoplasmic'
  | 'nuclear-cytoplasmic'
  | 'membranous-cytoplasmic'

export interface IhcMarkerSource {
  title: string
  organization: string
  url: string
  year?: string
}

export interface IhcOrganContext {
  organ: string
  tissue: string
  pattern: string
  meaning: string
  limitation: string
}

export interface IhcMarkerProfile {
  id: string
  name: string
  gene: string
  aliases: string[]
  category: string
  localization: IhcLocalization
  localizationVi: string
  signalVi: string
  summaryVi: string
  positiveVi: string
  negativeVi: string
  controlVi: string
  indicationsVi?: string[]
  organs: string[]
  pitfallsVi: string[]
  contexts: IhcOrganContext[]
  sources: IhcMarkerSource[]
  reviewedAt: string
}

export const IHC_LOCALIZATION_OPTIONS = [
  { value: 'all', title: 'Tất cả vị trí bắt màu' },
  { value: 'nuclear', title: 'Nhân / Nuclear' },
  { value: 'membranous', title: 'Màng / Membranous' },
  { value: 'cytoplasmic', title: 'Bào tương / Cytoplasmic' },
  { value: 'mixed', title: 'Phối hợp / Mixed' },
]

const reviewedAt = '02/09/2026'

export const IHC_MARKER_ATLAS: IhcMarkerProfile[] = [
  {
    id: 'alk',
    name: 'ALK (phổi)',
    gene: 'ALK',
    aliases: ['ALK', 'ALK (lung)', 'Anaplastic lymphoma kinase', 'Kinase lymphôm thoái sản', 'CD246'],
    category: 'Dấu ấn dự báo / protein dung hợp',
    localization: 'cytoplasmic',
    localizationVi: 'Bào tương dạng hạt',
    signalVi: 'Trong ung thư phổi không tế bào nhỏ, đọc tín hiệu bào tương dạng hạt rõ ở tế bào u. Kiểu bắt màu và ngưỡng phải được diễn giải theo clone, hệ thống xét nghiệm và thuật toán đã thẩm định.',
    summaryVi: 'ALK IHC có thể được dùng như xét nghiệm thay thế để phát hiện biểu hiện protein liên quan tái sắp xếp ALK trong ung thư phổi không tế bào nhỏ khi sử dụng assay đã được thẩm định. Không suy diễn trạng thái ALK chỉ từ một bắt màu nền hoặc từ mô bình thường.',
    positiveVi: 'Với VENTANA ALK (D5F3) CDx trong ung thư phổi không tế bào nhỏ: có tín hiệu bào tương dạng hạt mạnh ở tế bào u, ở bất kỳ tỷ lệ nào, được xếp dương tính theo thuật toán của assay. Báo cáo NordiQC còn đánh giá độ nhạy kỹ thuật bằng ung thư biểu mô tuyến phổi có tái sắp xếp ALK với bắt màu bào tương dạng hạt từ yếu-vừa đến mạnh.',
    negativeVi: 'Với D5F3 CDx: không có tín hiệu bào tương dạng hạt mạnh trong tế bào u được xếp âm tính. Một kết quả âm tính không đáng tin khi chứng mô không đạt, mô u quá ít, nền bất thường hoặc assay chưa được xác nhận hiệu năng; khi hình thái/lâm sàng không phù hợp cần cân nhắc xét nghiệm phân tử theo quy trình của cơ sở.',
    controlVi: 'Ruột thừa là chứng mô ngoài phù hợp: tế bào hạch và sợi trục phải bắt màu bào tương dạng hạt, trong khi biểu mô ruột thừa/đại tràng phải âm tính. Tín hiệu bất thường ở biểu mô hoặc lympho bào cho thấy độ đặc hiệu kỹ thuật không đạt.',
    indicationsVi: [
      'Đánh giá trạng thái ALK ở ung thư phổi không tế bào nhỏ khi cần định hướng điều trị nhắm trúng đích, theo hướng dẫn và assay đã được phê duyệt hoặc thẩm định tại cơ sở.',
      'Hỗ trợ sàng lọc protein dung hợp ALK trong ung thư biểu mô tuyến phổi; kết quả phải được tích hợp với mô học, bệnh phẩm, lâm sàng và xét nghiệm phân tử khi có chỉ định.',
      'Không dùng thuật toán ALK phổi để đọc máy móc cho lymphôm tế bào lớn thoái sản, u nguyên bào sợi cơ viêm hoặc các u khác có thể biểu hiện ALK.',
    ],
    organs: ['Phổi'],
    pitfallsVi: [
      'Không tính bắt màu lấm tấm nhẹ ở đại thực bào phế nang, tế bào thần kinh/hạch, biểu mô tuyến lành, tế bào lympho hoặc vùng hoại tử là tín hiệu dương tính của tế bào u.',
      'Clone ALK1 có thể không đủ nhạy cho ung thư biểu mô tuyến phổi có EML4::ALK; NordiQC 2025 ghi nhận OTI1A4, 5A4 và D5F3 có hiệu năng khác nhau tùy hệ thống và protocol.',
      'Ảnh HPA bên dưới dùng kháng thể HPA010694 trên mô bình thường, không phải clone D5F3 và không thay thế ảnh chấm điểm assay chẩn đoán.',
    ],
    contexts: [
      {
        organ: 'Phổi',
        tissue: 'Ung thư phổi không tế bào nhỏ / ung thư biểu mô tuyến phổi',
        pattern: 'D5F3 CDx: bào tương dạng hạt mạnh trong tế bào u; không yêu cầu một tỷ lệ tối thiểu nếu tín hiệu đặc hiệu hiện diện.',
        meaning: 'Hỗ trợ xác định bệnh nhân có khối u biểu hiện ALK và có thể phù hợp điều trị nhắm trúng đích theo chỉ định hiện hành.',
        limitation: 'Thuật toán phụ thuộc assay. Không áp dụng ngưỡng này cho clone hoặc nền tảng chưa được thẩm định; kết quả bất tương hợp cần được xử lý theo quy trình xác nhận của phòng xét nghiệm.',
      },
      {
        organ: 'Ruột thừa / đại tràng',
        tissue: 'Chứng mô kỹ thuật',
        pattern: 'Tế bào hạch và sợi trục bắt màu; biểu mô ruột thừa/đại tràng không bắt màu.',
        meaning: 'Đồng thời kiểm tra độ nhạy và độ đặc hiệu phân tích của lần nhuộm.',
        limitation: 'Biểu mô hoặc lympho bào bắt màu bất thường là dấu hiệu assay không đạt, không phải biểu hiện ALK có ý nghĩa chẩn đoán.',
      },
    ],
    sources: [
      {
        title: 'ALK (lung), Assessment Run 73',
        organization: 'NordiQC',
        url: 'https://nordiqc.org/downloads/assessments/201_14.pdf',
        year: '2025',
      },
      {
        title: 'VENTANA ALK (D5F3) CDx Assay Interpretation Guide',
        organization: 'U.S. Food and Drug Administration',
        url: 'https://www.accessdata.fda.gov/cdrh_docs/pdf14/P140025C.pdf',
        year: '2015',
      },
      {
        title: 'VENTANA ALK (D5F3) CDx Assay - Premarket Approval P140025',
        organization: 'U.S. Food and Drug Administration',
        url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=P140025',
      },
    ],
    reviewedAt,
  },
  {
    id: 'er',
    name: 'ER',
    gene: 'ESR1',
    aliases: ['Estrogen receptor', 'Thụ thể estrogen', 'ERα'],
    category: 'Thụ thể nội tiết',
    localization: 'nuclear',
    localizationVi: 'Nhân',
    signalVi: 'Tín hiệu nâu trong nhân tế bào u; không tính bắt màu bào tương vào tỷ lệ ER.',
    summaryVi: 'Marker thụ thể nội tiết, đặc biệt quan trọng trong đánh giá ung thư vú và một số u phụ khoa.',
    positiveVi: 'Trong ung thư vú xâm nhập, CAP/ASCO định nghĩa ER dương tính khi ≥1% nhân tế bào u bắt màu; 1–10% được báo cáo là ER dương tính thấp.',
    negativeVi: 'ER âm tính không tự xác định dòng biệt hóa. Kết quả 0–10% cần đặc biệt chú ý chứng nội và điều kiện tiền phân tích.',
    controlVi: 'Biểu mô tuyến vú lành trong tiêu bản có thể làm chứng nội; phải ghi nhận trạng thái chứng khi kết quả thấp hoặc âm tính.',
    organs: ['Vú', 'Phụ khoa'],
    pitfallsVi: [
      'Ngưỡng ≥1% nêu trên áp dụng cho ung thư vú xâm nhập, không được chuyển máy móc sang mọi cơ quan.',
      'Cố định không phù hợp, thiếu chứng nội hoặc mô u quá ít có thể làm giảm độ tin cậy.',
    ],
    contexts: [
      {
        organ: 'Vú',
        tissue: 'Ung thư vú xâm nhập',
        pattern: 'Bắt màu nhân; ghi tỷ lệ phần trăm và cường độ.',
        meaning: 'Dự báo khả năng đáp ứng điều trị nội tiết khi diễn giải theo hướng dẫn CAP/ASCO.',
        limitation: 'Nhóm 1–10% cần nhận xét “ER dương tính thấp” theo hướng dẫn.',
      },
      {
        organ: 'Phụ khoa',
        tissue: 'Các u nội mạc tử cung/buồng trứng phù hợp',
        pattern: 'Bắt màu nhân với mức độ lan tỏa thay đổi.',
        meaning: 'Hỗ trợ phân loại và định hướng nguồn gốc trong panel thích hợp.',
        limitation: 'Không sử dụng ngưỡng điều trị của ung thư vú cho u phụ khoa.',
      },
    ],
    sources: [
      {
        title: 'ER/PgR Testing in Breast Cancer - Guideline Recommendations',
        organization: 'College of American Pathologists',
        url: 'https://www.cap.org/protocols-and-guidelines/cap-guidelines/current-cap-guidelines/guideline-recommendations-for-immunohistochemical-testing-of-estrogen-and-progesterone-receptors-in-breast-cancer',
        year: '2020',
      },
    ],
    reviewedAt,
  },
  {
    id: 'her2',
    name: 'HER2',
    gene: 'ERBB2',
    aliases: ['HER-2', 'HER2/neu', 'c-erbB-2', 'Human epidermal growth factor receptor 2', 'Thụ thể yếu tố tăng trưởng biểu bì người 2'],
    category: 'Dấu ấn dự báo',
    localization: 'membranous',
    localizationVi: 'Màng tế bào',
    signalVi: 'Đánh giá cường độ, mức độ hoàn toàn và tỷ lệ màng tế bào u bắt màu theo thuật toán riêng của từng cơ quan.',
    summaryVi: 'Dấu ấn dự báo điều trị đích; cách chấm điểm ở vú và dạ dày/thực quản không giống nhau.',
    positiveVi: 'Ở ung thư vú, bắt màu màng hoàn toàn, mạnh ở >10% tế bào u tương ứng IHC 3+. Ở ung thư biểu mô tuyến dạ dày-thực quản, bắt màu màng bên hoặc đáy-bên có thể được tính theo tiêu chí riêng.',
    negativeVi: 'IHC 0/1+ không đồng nghĩa với mọi bối cảnh điều trị đều giống nhau. IHC 2+ là không xác định và thường cần xét nghiệm ISH theo hướng dẫn phù hợp.',
    controlVi: 'Dùng tiêu bản chứng có các mức biểu hiện đã xác định; phải đánh giá chất lượng màng và nền trước khi chấm điểm.',
    organs: ['Vú', 'Dạ dày - thực quản'],
    pitfallsVi: [
      'Không áp dụng tiêu chí chấm điểm ung thư vú cho ung thư dạ dày-thực quản.',
      'Tính không đồng nhất trong u và khác biệt giữa sinh thiết với bệnh phẩm cắt có thể ảnh hưởng kết quả.',
    ],
    contexts: [
      {
        organ: 'Vú',
        tissue: 'Ung thư vú xâm nhập',
        pattern: 'Màng hoàn toàn, mạnh, >10% tế bào u: IHC 3+.',
        meaning: 'Đánh giá tình trạng HER2 để lựa chọn điều trị theo hướng dẫn hiện hành.',
        limitation: 'IHC 2+ cần đối chiếu ISH; phải theo thuật toán CAP/ASCO cập nhật.',
      },
      {
        organ: 'Dạ dày - thực quản',
        tissue: 'Ung thư biểu mô tuyến dạ dày-thực quản',
        pattern: 'Bắt màu màng bên/đáy-bên được chấp nhận; tiêu chí sinh thiết và bệnh phẩm cắt khác nhau.',
        meaning: 'Xác định đối tượng có thể phù hợp điều trị kháng HER2.',
        limitation: 'U thường không đồng nhất; cần chọn vùng và số mảnh sinh thiết phù hợp.',
      },
    ],
    sources: [
      {
        title: 'HER2 Testing in Breast Cancer - 2023 Guideline Update',
        organization: 'College of American Pathologists',
        url: 'https://www.cap.org/cap-guidelines/her2-testing-in-breast-cancer-2023-guideline-update/',
        year: '2023',
      },
      {
        title: 'HER2 Testing in Gastroesophageal Adenocarcinoma',
        organization: 'College of American Pathologists',
        url: 'https://www.cap.org/protocols-and-guidelines/cap-guidelines/current-cap-guidelines/her2-testing-and-clinical-decision-making-in-gastroesophageal-adenocarcinoma',
      },
    ],
    reviewedAt,
  },
  {
    id: 'ki67',
    name: 'Ki-67',
    gene: 'MKI67',
    aliases: ['Ki67', 'MIB-1', 'Chỉ số tăng sinh'],
    category: 'Tăng sinh',
    localization: 'nuclear',
    localizationVi: 'Nhân',
    signalVi: 'Nhân tế bào đang tăng sinh bắt màu; báo cáo thường là tỷ lệ phần trăm theo quy trình của từng loại u.',
    summaryVi: 'Dấu ấn tăng sinh tế bào. Ý nghĩa và cách đếm phụ thuộc loại u, vùng đếm và hướng dẫn chuyên ngành.',
    positiveVi: 'Tỷ lệ nhân dương tính phản ánh phân suất tế bào đang tăng sinh, nhưng không có một ngưỡng chung dùng cho mọi u.',
    negativeVi: 'Chỉ số thấp không tự khẳng định lành tính; cần xét chất lượng mô, vùng chọn đếm và sinh học của loại u.',
    controlVi: 'Amidan: trung tâm mầm bắt màu mạnh, vùng áo ít hơn; biểu mô lát có gradient tăng sinh ở lớp đáy.',
    organs: ['Đa cơ quan', 'Vú', 'Thần kinh nội tiết', 'Huyết học'],
    pitfallsVi: [
      'Không chuyển ngưỡng Ki-67 giữa các cơ quan hoặc thực thể u.',
      'Điểm nóng, dị hợp trong u, tiền xử lý và phương pháp đếm làm thay đổi kết quả.',
    ],
    contexts: [
      {
        organ: 'Vú',
        tissue: 'Ung thư vú ER dương tính giai đoạn sớm, nguy cơ thuận lợi',
        pattern: 'Đếm nhân tế bào u theo quy trình chuẩn hóa.',
        meaning: 'Nhóm chuyên gia quốc tế ghi nhận độ lặp lại tốt hơn ở hai đầu ≤5% và ≥30% trong bối cảnh chọn lọc.',
        limitation: 'Giá trị lâm sàng còn hạn chế và không thay thế xét nghiệm đa gen khi có chỉ định.',
      },
      {
        organ: 'Thần kinh nội tiết',
        tissue: 'U thần kinh nội tiết',
        pattern: 'Đếm nhân tại vùng tăng sinh cao theo hướng dẫn của cơ quan liên quan.',
        meaning: 'Có thể tham gia phân độ cùng số phân bào.',
        limitation: 'Cách đếm và ngưỡng phụ thuộc vị trí nguyên phát và phân loại WHO tương ứng.',
      },
    ],
    sources: [
      {
        title: 'Ki-67 Immunohistochemistry',
        organization: 'RCPAQAP',
        url: 'https://specialstains.rcpaqap.com.au/stain/ki-67/',
      },
      {
        title: 'Assessment of Ki67 in Breast Cancer - Updated Recommendations',
        organization: 'International Ki67 in Breast Cancer Working Group',
        url: 'https://academic.oup.com/jnci/article/113/7/808/6053794',
        year: '2021',
      },
      {
        title: 'Ki-67',
        organization: 'PathologyOutlines',
        url: 'https://www.pathologyoutlines.com/topic/stainski67.html',
      },
    ],
    reviewedAt,
  },
  {
    id: 'ttf1',
    name: 'TTF-1',
    gene: 'NKX2-1',
    aliases: ['TTF1', 'Thyroid transcription factor 1', 'Yếu tố phiên mã tuyến giáp 1'],
    category: 'Định hướng dòng biệt hóa',
    localization: 'nuclear',
    localizationVi: 'Nhân',
    signalVi: 'Chỉ đọc tín hiệu nhân đặc hiệu; bắt màu bào tương không được xem là dương tính TTF-1 đặc hiệu.',
    summaryVi: 'Hỗ trợ định hướng biệt hóa phổi và tuyến giáp, nhưng không phải marker đặc hiệu tuyệt đối cho cơ quan.',
    positiveVi: 'Thường dương tính ở biểu mô phế nang typ II/Clara, nhiều ung thư biểu mô tuyến phổi, nhiều ung thư tế bào nhỏ và u nguồn gốc biểu mô nang tuyến giáp.',
    negativeVi: 'Âm tính không loại trừ ung thư biểu mô tuyến phổi, đặc biệt ở u biệt hóa kém hoặc một số dưới nhóm nhầy.',
    controlVi: 'Phổi lành với phế bào typ II và tuyến giáp lành là chứng mô thích hợp.',
    organs: ['Phổi', 'Tuyến giáp'],
    pitfallsVi: [
      'Độ nhạy và độ đặc hiệu thay đổi theo clone; clone khuếch đại tín hiệu có thể tăng bắt màu ngoài phổi.',
      'TTF-1 dương tính trong ung thư tế bào nhỏ không đủ để xác định phổi là vị trí nguyên phát.',
    ],
    contexts: [
      {
        organ: 'Phổi',
        tissue: 'Ung thư biểu mô tuyến hoặc NSCLC biệt hóa kém',
        pattern: 'Bắt màu nhân; thường dùng cùng Napsin A và marker vảy như p40.',
        meaning: 'Hỗ trợ biệt hóa tuyến phổi trong panel phù hợp.',
        limitation: 'Không đặc hiệu tuyệt đối; phải đối chiếu lâm sàng, hình ảnh và clone kháng thể.',
      },
      {
        organ: 'Tuyến giáp',
        tissue: 'U có biệt hóa tế bào nang tuyến giáp',
        pattern: 'Bắt màu nhân lan tỏa với mức độ thay đổi.',
        meaning: 'Hỗ trợ nguồn gốc tuyến giáp khi phối hợp thyroglobulin và PAX8.',
        limitation: 'Không tự phân biệt được tổn thương lành với ác hoặc nguồn gốc phổi với tuyến giáp.',
      },
    ],
    sources: [
      {
        title: 'TTF-1 Immunohistochemistry',
        organization: 'RCPAQAP',
        url: 'https://specialstains.rcpaqap.com.au/stain/ttf-1/',
      },
      {
        title: 'TTF-1',
        organization: 'PathologyOutlines',
        url: 'https://www.pathologyoutlines.com/topic/stainsttf1.html',
      },
      {
        title: 'Best Practices Recommendations for Diagnostic IHC in Lung Cancer',
        organization: 'IASLC',
        url: 'https://education.iaslc.org/AssetListing/Special-Article-Best-Practices-Recommendations-for-Diagnostic-Immunohistochemistry-in-Lung-Cancer-3316/PIIS1556086418335147-22263',
      },
    ],
    reviewedAt,
  },
  {
    id: 'napsina',
    name: 'Napsin A',
    gene: 'NAPSA',
    aliases: ['Napsin-A', 'NAPSA'],
    category: 'Định hướng dòng biệt hóa',
    localization: 'cytoplasmic',
    localizationVi: 'Bào tương dạng hạt',
    signalVi: 'Bắt màu bào tương dạng hạt; cần phân biệt tế bào u với đại thực bào phế nang dương tính.',
    summaryVi: 'Hỗ trợ biệt hóa tuyến phổi; cũng biểu hiện ở ống thận và một số u tế bào sáng phụ khoa.',
    positiveVi: 'Dương tính dạng hạt trong bào tương hỗ trợ ung thư biểu mô tuyến phổi khi phù hợp hình thái và panel.',
    negativeVi: 'Âm tính không loại trừ ung thư biểu mô tuyến phổi, nhất là các dưới nhóm biệt hóa kém hoặc dạng nhầy.',
    controlVi: 'Ống lượn gần thận hoặc phế bào typ II là chứng mô phù hợp.',
    organs: ['Phổi', 'Thận', 'Phụ khoa'],
    pitfallsVi: [
      'Đại thực bào phế nang có thể dương tính mạnh và bị nhầm với tế bào u.',
      'Dương tính không đồng nghĩa nguồn gốc phổi vì một số u thận và u tế bào sáng phụ khoa cũng biểu hiện.',
    ],
    contexts: [
      {
        organ: 'Phổi',
        tissue: 'Ung thư biểu mô tuyến phổi',
        pattern: 'Bào tương dạng hạt; dùng cùng TTF-1 trong panel tối giản khi phù hợp.',
        meaning: 'Tăng mức hỗ trợ cho biệt hóa tuyến phổi.',
        limitation: 'Không đọc đại thực bào dương tính như tế bào u.',
      },
      {
        organ: 'Phụ khoa',
        tissue: 'Ung thư biểu mô tế bào sáng',
        pattern: 'Bào tương dạng hạt, thường khu trú hoặc lan tỏa.',
        meaning: 'Có thể hỗ trợ kiểu biệt hóa tế bào sáng trong panel.',
        limitation: 'Không dùng đơn độc để xác định vị trí nguyên phát.',
      },
    ],
    sources: [
      {
        title: 'Napsin A Immunohistochemistry',
        organization: 'RCPAQAP',
        url: 'https://specialstains.rcpaqap.com.au/stain/napsin-a/',
      },
      {
        title: 'Napsin A',
        organization: 'PathologyOutlines',
        url: 'https://www.pathologyoutlines.com/topic/stainsnapsina.html',
      },
    ],
    reviewedAt,
  },
  {
    id: 'p40',
    name: 'p40',
    gene: 'TP63 (ΔNp63)',
    aliases: ['DeltaNp63', 'ΔNp63', 'p40 IHC'],
    category: 'Định hướng dòng biệt hóa',
    localization: 'nuclear',
    localizationVi: 'Nhân',
    signalVi: 'Bắt màu nhân tế bào u; mức độ lan tỏa và cường độ phải được đọc cùng hình thái.',
    summaryVi: 'Marker biệt hóa tế bào vảy/basal có độ đặc hiệu cao hơn p63 trong nhiều bối cảnh, đặc biệt ở phổi.',
    positiveVi: 'Dương tính nhân lan tỏa hỗ trợ biệt hóa vảy khi hình thái phù hợp; thường được phối hợp TTF-1 trong NSCLC biệt hóa kém.',
    negativeVi: 'Âm tính làm giảm khả năng biệt hóa vảy nhưng không loại trừ hoàn toàn, nhất là mẫu nhỏ hoặc u biệt hóa kém.',
    controlVi: 'Tế bào đáy của biểu mô lát hoặc tuyến tiền liệt lành có thể làm chứng mô.',
    organs: ['Phổi', 'Đầu cổ', 'Da', 'Tiết niệu'],
    pitfallsVi: [
      'p40 không xác định vị trí nguyên phát vì nhiều biểu mô vảy/basal ở các cơ quan khác nhau dương tính.',
      'Không đồng nhất p40 với p63; đây là các kháng thể nhận diện isoform khác nhau của TP63.',
    ],
    contexts: [
      {
        organ: 'Phổi',
        tissue: 'NSCLC biệt hóa kém',
        pattern: 'Bắt màu nhân; phối hợp TTF-1 để tiết kiệm mô trong mẫu nhỏ.',
        meaning: 'Hỗ trợ phân loại ung thư biểu mô tế bào vảy khi lan tỏa và phù hợp hình thái.',
        limitation: 'Không dùng riêng để chứng minh nguồn gốc phổi.',
      },
      {
        organ: 'Đầu cổ',
        tissue: 'U có biệt hóa vảy/basal',
        pattern: 'Bắt màu nhân với mức độ thay đổi.',
        meaning: 'Xác nhận biệt hóa vảy/basal trong panel thích hợp.',
        limitation: 'Không thay thế p16/ISH HPV hoặc EBER khi câu hỏi chẩn đoán yêu cầu căn nguyên virus.',
      },
    ],
    sources: [
      {
        title: 'Best Practices Recommendations for Diagnostic IHC in Lung Cancer',
        organization: 'IASLC',
        url: 'https://education.iaslc.org/AssetListing/Special-Article-Best-Practices-Recommendations-for-Diagnostic-Immunohistochemistry-in-Lung-Cancer-3316/PIIS1556086418335147-22263',
      },
      {
        title: 'Dataset for Histopathological Reporting of Lung Cancer',
        organization: 'Royal College of Pathologists',
        url: 'https://www.rcpath.org/resourceLibrary/g048-dataset-for-histopathological-reporting-of-lung-cancer.html',
      },
      {
        title: 'p40',
        organization: 'PathologyOutlines',
        url: 'https://www.pathologyoutlines.com/topic/stainsp40.html',
      },
    ],
    reviewedAt,
  },
  {
    id: 'pax8',
    name: 'PAX8',
    gene: 'PAX8',
    aliases: ['Paired box gene 8', 'PAX-8'],
    category: 'Định hướng nguồn gốc',
    localization: 'nuclear',
    localizationVi: 'Nhân',
    signalVi: 'Chỉ đọc bắt màu nhân đặc hiệu trong tế bào đích.',
    summaryVi: 'Hỗ trợ nguồn gốc thận, tuyến giáp và Müller; phạm vi phản ứng phụ thuộc clone kháng thể.',
    positiveVi: 'Dương tính nhân hỗ trợ biệt hóa thận, tuyến giáp hoặc Müller khi phù hợp với hình thái và panel.',
    negativeVi: 'Âm tính không loại trừ tuyệt đối các nguồn gốc trên do biểu hiện thay đổi theo thực thể và độ biệt hóa.',
    controlVi: 'Ống thận, biểu mô vòi tử cung hoặc tuyến giáp lành có thể dùng làm chứng mô.',
    organs: ['Thận', 'Tuyến giáp', 'Phụ khoa'],
    pitfallsVi: [
      'Kháng thể đa dòng có thể phản ứng chéo với PAX5 ở tế bào B; cần biết clone đang sử dụng.',
      'PAX8 dương tính không tự phân biệt ba nhóm nguồn gốc thận, tuyến giáp và Müller.',
    ],
    contexts: [
      {
        organ: 'Thận',
        tissue: 'U biểu mô thận',
        pattern: 'Bắt màu nhân với tỷ lệ thay đổi theo dưới nhóm.',
        meaning: 'Hỗ trợ nguồn gốc biểu mô thận trong panel.',
        limitation: 'Không đủ để phân loại dưới nhóm ung thư biểu mô tế bào thận.',
      },
      {
        organ: 'Phụ khoa',
        tissue: 'U nguồn gốc Müller',
        pattern: 'Bắt màu nhân, thường phối hợp WT1, ER, p53 và marker khác theo hình thái.',
        meaning: 'Hỗ trợ nguồn gốc Müller.',
        limitation: 'Một số u không thuộc Müller cũng có thể dương tính tùy clone.',
      },
    ],
    sources: [
      {
        title: 'PAX8 Immunohistochemistry',
        organization: 'RCPAQAP',
        url: 'https://specialstains.rcpaqap.com.au/stain/pax8-5/',
      },
      {
        title: 'PAX8',
        organization: 'PathologyOutlines',
        url: 'https://www.pathologyoutlines.com/topic/stainspax8.html',
      },
    ],
    reviewedAt,
  },
  {
    id: 'melana',
    name: 'Melan-A',
    gene: 'MLANA',
    aliases: ['MART-1', 'MelanA', 'MLANA'],
    category: 'Biệt hóa tế bào hắc tố',
    localization: 'cytoplasmic',
    localizationVi: 'Bào tương',
    signalVi: 'Bắt màu bào tương dạng hạt; sắc tố melanin cần được phân biệt với chromogen nâu.',
    summaryVi: 'Hỗ trợ biệt hóa tế bào hắc tố; cũng có thể dương tính ở PEComa và u vỏ thượng thận/sinh dục.',
    positiveVi: 'Dương tính bào tương hỗ trợ biệt hóa tế bào hắc tố khi phối hợp SOX10/S100 và hình thái phù hợp.',
    negativeVi: 'Âm tính không loại trừ melanoma, đặc biệt melanoma xơ hóa thường giảm hoặc mất biểu hiện.',
    controlVi: 'Melanocyte ở da lành là chứng nội phù hợp; tế bào lớp đáy không phải tất cả đều là tế bào u.',
    organs: ['Da', 'Mô mềm', 'Thượng thận', 'Phụ khoa'],
    pitfallsVi: [
      'PEComa, angiomyolipoma và u vỏ thượng thận có thể dương tính, nên Melan-A không đặc hiệu cho melanoma.',
      'Melanin nội sinh có thể che lấp hoặc giả giống DAB; cân nhắc chromogen khác khi cần.',
    ],
    contexts: [
      {
        organ: 'Da',
        tissue: 'Tổn thương tế bào hắc tố',
        pattern: 'Bắt màu bào tương, giúp biểu diễn phân bố melanocyte.',
        meaning: 'Hỗ trợ xác định biệt hóa melanocytic và đánh giá kiến trúc.',
        limitation: 'Melanoma xơ hóa có thể âm tính; cần phối hợp SOX10/S100.',
      },
      {
        organ: 'Mô mềm',
        tissue: 'PEComa/angiomyolipoma',
        pattern: 'Bào tương dương tính với mức độ thay đổi.',
        meaning: 'Hỗ trợ kiểu biệt hóa quanh mạch dạng biểu mô trong panel.',
        limitation: 'Không phân biệt với melanoma nếu thiếu hình thái và marker cơ trơn.',
      },
    ],
    sources: [
      {
        title: 'Melan-A Immunohistochemistry',
        organization: 'RCPAQAP',
        url: 'https://specialstains.rcpaqap.com.au/stain/melana/',
      },
      {
        title: 'MART-1 / Melan-A',
        organization: 'PathologyOutlines',
        url: 'https://www.pathologyoutlines.com/topic/stainsmart1.html',
      },
    ],
    reviewedAt,
  },
  {
    id: 's100',
    name: 'S100',
    gene: 'S100 protein family',
    aliases: ['S-100', 'S100 protein'],
    category: 'Dấu ấn đa dòng',
    localization: 'nuclear-cytoplasmic',
    localizationVi: 'Nhân và bào tương',
    signalVi: 'Tín hiệu đặc hiệu có thể xuất hiện đồng thời trong nhân và bào tương.',
    summaryVi: 'Marker nhạy nhưng ít đặc hiệu, biểu hiện ở nhiều dòng tế bào; phù hợp để sàng lọc trong panel hơn là kết luận đơn độc.',
    positiveVi: 'Dương tính có thể gặp ở tế bào hắc tố, Schwann, Langerhans, mô sụn-mỡ và nhiều u khác.',
    negativeVi: 'Âm tính làm giảm khả năng một số thực thể nhưng không loại trừ tất cả melanoma hoặc u bao dây thần kinh.',
    controlVi: 'Tế bào Schwann của dây thần kinh, melanocyte hoặc tế bào tua ở mô lành có thể làm chứng nội.',
    organs: ['Da', 'Thần kinh', 'Mô mềm', 'Đa cơ quan'],
    pitfallsVi: [
      'Độ nhạy cao đi kèm độ đặc hiệu thấp; không dùng S100 đơn độc để chẩn đoán melanoma.',
      'Nhiều tế bào nền bình thường dương tính có thể làm khó việc xác định quần thể u.',
    ],
    contexts: [
      {
        organ: 'Da',
        tissue: 'U tế bào hắc tố',
        pattern: 'Nhân và bào tương dương tính, thường nhạy.',
        meaning: 'Marker sàng lọc cho biệt hóa melanocytic.',
        limitation: 'Cần SOX10, Melan-A/HMB45 và hình thái để tăng độ đặc hiệu.',
      },
      {
        organ: 'Thần kinh ngoại biên',
        tissue: 'U bao dây thần kinh',
        pattern: 'Nhân và bào tương; mức độ thay đổi theo thực thể và độ ác tính.',
        meaning: 'Hỗ trợ biệt hóa Schwannian.',
        limitation: 'U ác bao dây thần kinh ngoại biên có thể chỉ dương tính khu trú hoặc âm tính.',
      },
    ],
    sources: [
      {
        title: 'S100 Immunohistochemistry',
        organization: 'RCPAQAP',
        url: 'https://specialstains.rcpaqap.com.au/stain/s100/',
      },
      {
        title: 'S100',
        organization: 'PathologyOutlines',
        url: 'https://www.pathologyoutlines.com/topic/stainss100.html',
      },
    ],
    reviewedAt,
  },
  {
    id: 'glypican3',
    name: 'Glypican-3',
    gene: 'GPC3',
    aliases: ['GPC3', 'Glypican 3'],
    category: 'Biệt hóa gan/phôi',
    localization: 'membranous-cytoplasmic',
    localizationVi: 'Màng và bào tương',
    signalVi: 'Bắt màu bào tương và/hoặc màng; kiểu canalicular có thể gặp trong u biệt hóa gan.',
    summaryVi: 'Hỗ trợ ung thư biểu mô tế bào gan và u túi noãn hoàng trong panel phù hợp.',
    positiveVi: 'Dương tính hỗ trợ HCC hoặc biệt hóa túi noãn hoàng tùy hình thái, cơ quan và các marker đi kèm.',
    negativeVi: 'Âm tính không loại trừ HCC; độ nhạy thay đổi theo mức độ biệt hóa và dưới nhóm u.',
    controlVi: 'Mô u đã biết dương tính; gan người lớn bình thường thường không biểu hiện đáng kể.',
    organs: ['Gan', 'Tinh hoàn', 'Phụ khoa'],
    pitfallsVi: [
      'Một số ung thư ngoài gan có thể dương tính; không dùng Glypican-3 đơn độc để xác định nguồn gốc gan.',
      'Trong HCC nên phối hợp Arginase-1, HepPar-1 và marker khác theo câu hỏi chẩn đoán.',
    ],
    contexts: [
      {
        organ: 'Gan',
        tissue: 'Ung thư biểu mô tế bào gan',
        pattern: 'Màng và/hoặc bào tương, có thể khu trú hoặc lan tỏa.',
        meaning: 'Hỗ trợ HCC, đặc biệt khi phối hợp marker biệt hóa gan.',
        limitation: 'Không hoàn toàn nhạy hoặc đặc hiệu; cần panel và hình thái.',
      },
      {
        organ: 'Tế bào mầm',
        tissue: 'U túi noãn hoàng',
        pattern: 'Bào tương và màng dương tính.',
        meaning: 'Hỗ trợ biệt hóa túi noãn hoàng cùng AFP/SALL4 trong panel.',
        limitation: 'Không dùng để phân loại toàn bộ u tế bào mầm.',
      },
    ],
    sources: [
      {
        title: 'Glypican-3 Immunohistochemistry',
        organization: 'RCPAQAP',
        url: 'https://specialstains.rcpaqap.com.au/stain/glypican-3-glp3/',
      },
      {
        title: 'Glypican-3',
        organization: 'PathologyOutlines',
        url: 'https://www.pathologyoutlines.com/topic/stainsglypican3.html',
      },
    ],
    reviewedAt,
  },
]
