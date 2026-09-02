export interface IhcPanelMember {
  marker: string
  role: string
}

export interface IhcDiagnosticPanel {
  id: string
  title: string
  question: string
  rationale: string
  members: IhcPanelMember[]
  sourceUrls: string[]
}

const nordiqc = 'https://www.nordiqc.org/epitope.php'
const capMmr = 'https://www.cap.org/protocols-and-guidelines/cap-guidelines/current-cap-guidelines/mismatch-repair-and-microsatellite-instability-testing-for-immune-checkpoint-inhibitor-therapy'
const fdaCdx = 'https://www.fda.gov/medical-devices/in-vitro-diagnostics/list-fda-authorized-companion-diagnostic-devices-in-vitro-and-imaging-tools'

const panel = (
  id: string,
  title: string,
  question: string,
  rationale: string,
  markers: Array<[string, string]>,
  sourceUrls: string[] = [nordiqc],
): IhcDiagnosticPanel => ({
  id,
  title,
  question,
  rationale,
  members: markers.map(([marker, role]) => ({ marker, role })),
  sourceUrls,
})

export const IHC_DIAGNOSTIC_PANELS: IhcDiagnosticPanel[] = [
  panel('lineage-screen', 'Sàng lọc dòng biệt hóa', 'U ác tính chưa rõ dòng biệt hóa', 'CK-PAN/EMA/CLDN4/EpCAM hỗ trợ biểu mô; CD45 hướng dòng tạo máu; S100/SOX10 gợi dòng melanocytic-thần kinh; vimentin nhạy nhưng ít đặc hiệu.', [
    ['CK-PAN', 'Khẳng định biệt hóa biểu mô'], ['EMA', 'Hỗ trợ biểu mô và một số u khác'], ['CLDN4', 'Hỗ trợ carcinoma'], ['EpCAM', 'Hỗ trợ biểu mô'], ['CD45', 'Hướng dòng tạo máu'], ['S100', 'Sàng lọc melanocytic/thần kinh'], ['SOX10', 'Hỗ trợ melanocytic/Schwann'], ['VIM', 'Marker trung mô nhạy, ít đặc hiệu'],
  ]),
  panel('lung-nsclc', 'NSCLC: tuyến hay vảy', 'Phân loại NSCLC biệt hóa kém trên mẫu nhỏ', 'TTF-1 và Napsin A bổ trợ biệt hóa tuyến; p40 đặc hiệu hơn p63 cho biệt hóa vảy, CK5 hỗ trợ kiểu vảy/basal. Panel tối giản giúp bảo tồn mô cho xét nghiệm phân tử.', [
    ['TTF1', 'Biệt hóa tuyến phổi'], ['Napsin A', 'Bổ trợ TTF-1'], ['p40', 'Biệt hóa vảy'], ['p63', 'Nhạy nhưng kém đặc hiệu hơn p40'], ['CK5', 'Hỗ trợ vảy/basal'], ['CK7', 'Thường hỗ trợ tuyến nhưng ít đặc hiệu'],
  ]),
  panel('mesothelioma', 'Mesothelioma hay carcinoma', 'Phân biệt u trung biểu mô với carcinoma', 'Dùng ít nhất hai marker trung biểu mô và hai marker biểu mô theo hình thái. BAP1 mất biểu hiện hỗ trợ ác tính trong bối cảnh thích hợp nhưng không phải lúc nào cũng mất.', [
    ['CALRET', 'Marker trung biểu mô, đọc nhân và bào tương'], ['WT1', 'Hỗ trợ trung biểu mô, đọc nhân'], ['Podop', 'Hỗ trợ trung biểu mô, đọc màng'], ['CK5', 'Hỗ trợ mesothelioma biểu mô'], ['CLDN4', 'Hỗ trợ carcinoma'], ['CEA', 'Hỗ trợ carcinoma tuyến'], ['EpCAM', 'Hỗ trợ carcinoma'], ['BAP1', 'Mất nhân hỗ trợ mesothelioma ác tính'],
  ]),
  panel('breast-lineage', 'Nguồn gốc tuyến vú', 'Khối u nghi di căn hoặc biệt hóa tuyến vú', 'GATA3 và TRPS1 thường nhạy; mammaglobin và GCDFP-15 đặc hiệu hơn trong một số bối cảnh nhưng kém nhạy. ER/PR hỗ trợ nhưng không đặc hiệu tuyệt đối.', [
    ['GATA3', 'Marker định dòng nhạy'], ['TRPS1', 'Bổ trợ, đặc biệt ở một số u bộ ba âm tính'], ['MAMGLO', 'Hỗ trợ nguồn gốc vú'], ['GCDFP', 'Hỗ trợ biệt hóa apocrine/vú'], ['ER', 'Thụ thể nội tiết'], ['PR', 'Thụ thể nội tiết'],
  ]),
  panel('breast-predictive', 'Bộ dấu ấn ung thư vú', 'Đánh giá yếu tố dự báo và tăng sinh', 'ER/PR đánh giá đáp ứng nội tiết; HER2 IHC được phản xạ sang ISH theo thuật toán khi cần; Ki-67 chỉ diễn giải trong bối cảnh đã chuẩn hóa.', [
    ['ER', 'Dự báo điều trị nội tiết'], ['PR', 'Bổ trợ đánh giá trục nội tiết'], ['HER2 IHC', 'Sàng lọc biểu hiện HER2'], ['HER2 ISH', 'Đánh giá khuếch đại gen'], ['Ki67', 'Chỉ số tăng sinh'],
  ], [nordiqc, fdaCdx]),
  panel('breast-ecad', 'Tuyến vú: ống hay tiểu thùy', 'Hỗ trợ phân biệt kiểu ống với kiểu tiểu thùy', 'Mất kết dính màng E-cadherin hỗ trợ kiểu tiểu thùy khi phù hợp hình thái; GATA3/TRPS1 xác nhận biệt hóa vú nhưng không giải quyết riêng câu hỏi ống-tiểu thùy.', [
    ['ECAD', 'Đánh giá kết dính màng'], ['GATA3', 'Xác nhận biệt hóa vú'], ['TRPS1', 'Bổ trợ nguồn gốc vú'], ['CK8/18', 'Hỗ trợ biểu mô lòng tuyến'],
  ]),
  panel('gi-origin', 'Nguồn gốc tiêu hóa dưới', 'Carcinoma tuyến nghi nguồn gốc ruột/đại trực tràng', 'CDX2 hỗ trợ biệt hóa ruột; SATB2 tăng độ đặc hiệu cho nguồn gốc đại trực tràng khi phối hợp; CK20/CK7 mô tả kiểu cytokeratin nhưng không tự xác định cơ quan.', [
    ['CDX2', 'Biệt hóa ruột'], ['SATB2', 'Bổ trợ nguồn gốc đại trực tràng'], ['CK20', 'Kiểu cytokeratin tiêu hóa/urothelial'], ['CK7', 'Đối chiếu kiểu cytokeratin'], ['CEA', 'Hỗ trợ biệt hóa tuyến'],
  ]),
  panel('hepatocellular', 'Biệt hóa tế bào gan', 'HCC hay carcinoma di căn/đường mật', 'Hepatocyte antigen và glypican-3 bổ trợ biệt hóa tế bào gan; CK7/CK19 có thể gợi kiểu đường mật hoặc kiểu tiền thân nhưng phải đọc cùng hình thái.', [
    ['HEPA', 'Hỗ trợ biệt hóa tế bào gan'], ['GPC3', 'Hỗ trợ HCC, nhất là u biệt hóa kém'], ['CK7', 'Hỗ trợ đường mật trong panel'], ['CK19', 'Hỗ trợ đường mật/kiểu tiền thân'], ['CEA', 'Kiểu canalicular có thể hỗ trợ HCC'],
  ]),
  panel('pancreatobiliary', 'Biệt hóa tụy - đường mật', 'Carcinoma tuyến nghi nguồn gốc tụy hoặc đường mật', 'CK7/CK19 và claudin-4 hỗ trợ kiểu hình biểu mô nhưng ít đặc hiệu; mất biểu hiện nhân SMAD4 có thể hỗ trợ nguồn gốc tụy trong bối cảnh phù hợp, song biểu hiện còn bảo tồn không loại trừ.', [
    ['CK7', 'Kiểu cytokeratin thường gặp'], ['CK19', 'Hỗ trợ biểu mô ống mật/tụy'], ['CLDN4', 'Hỗ trợ carcinoma'], ['CEA', 'Hỗ trợ biệt hóa tuyến'], ['Smad4', 'Đánh giá mất biểu hiện nhân trong tế bào u'],
  ]),
  panel('urothelial', 'Biệt hóa niệu mạc', 'Carcinoma nghi nguồn gốc niệu mạc', 'GATA3 nhạy nhưng không đặc hiệu; uroplakin II/III đặc hiệu hơn và bổ trợ; p63/p40 cùng CK7/CK20 giúp nhận diện kiểu basal và kiểu cytokeratin.', [
    ['GATA3', 'Marker định dòng nhạy'], ['URO II/III', 'Marker niệu mạc đặc hiệu hơn'], ['p63', 'Hỗ trợ basal/niệu mạc'], ['p40', 'Bổ trợ biệt hóa basal/vảy'], ['CK7', 'Kiểu cytokeratin'], ['CK20', 'Kiểu cytokeratin'],
  ]),
  panel('prostate-origin', 'Nguồn gốc tuyến tiền liệt', 'Carcinoma di căn nghi nguồn gốc tiền liệt tuyến', 'NKX3.1 có độ nhạy cao cho nguồn gốc tiền liệt; PSA/PAP bổ trợ nhưng có thể giảm ở u biệt hóa kém; P501S là marker bổ sung.', [
    ['NKX3.1', 'Marker nhân định hướng nguồn gốc tiền liệt'], ['PSA', 'Biệt hóa tuyến tiền liệt'], ['PAP', 'Bổ trợ PSA'], ['P501S', 'Bổ trợ nguồn gốc tiền liệt'],
  ]),
  panel('prostate-focus', 'Ổ tuyến tiền liệt nhỏ', 'Ung thư tuyến tiền liệt hay tuyến lành', 'AMACR là marker dương hỗ trợ nhưng không đặc hiệu; mất lớp tế bào đáy qua p63/CK5 hỗ trợ carcinoma. Luôn đối chiếu hình thái và dùng cả marker dương lẫn marker đáy.', [
    ['AMACR', 'Marker dương hỗ trợ carcinoma'], ['p63', 'Marker tế bào đáy'], ['CK5', 'Marker tế bào đáy'], ['P501S', 'Hỗ trợ biệt hóa tiền liệt'],
  ]),
  panel('pax8-origin', 'Nguồn gốc PAX8', 'Phân biệt nguồn gốc thận, Müller hoặc tuyến giáp', 'PAX8 nhạy cho ba dòng chính nhưng không tự phân biệt chúng; phối hợp PAX2, TTF-1, WT1, ER và marker đặc hiệu cơ quan để thu hẹp nguồn gốc.', [
    ['PAX8', 'Marker nhân định dòng'], ['PAX2', 'Bổ trợ nguồn gốc thận/Müller'], ['TTF1', 'Bổ trợ tuyến giáp hoặc phổi'], ['WT1', 'Bổ trợ thanh dịch/Mesothelioma/Wilms tùy bối cảnh'], ['ER', 'Bổ trợ Müller/vú'], ['CA125', 'Hỗ trợ Müller/mesothelial'],
  ]),
  panel('gist', 'GIST hay u hình thoi khác', 'U trung mô đường tiêu hóa', 'DOG1 và CD117 bổ trợ nhau, tăng độ nhạy cho GIST; CD34 thường hỗ trợ. Desmin, S100 và SMA giúp đánh giá các hướng biệt hóa cơ, Schwann và cơ-sợi.', [
    ['DOG1', 'Marker GIST nhạy và tương đối đặc hiệu'], ['CD117', 'Bổ trợ DOG1'], ['CD34', 'Thường hỗ trợ GIST'], ['DES', 'Hướng biệt hóa cơ'], ['ASMA', 'Hướng cơ trơn/cơ-sợi'], ['S100', 'Hướng Schwann/melanocytic'],
  ]),
  panel('melanocytic', 'Tổn thương melanocytic', 'Xác nhận dòng melanocytic và đánh giá ác tính', 'S100/SOX10 nhạy; Melan-A và HMB-45 bổ trợ biệt hóa melanocytic; PRAME có thể hỗ trợ đánh giá ác tính nhưng không thay thế hình thái.', [
    ['S100', 'Marker sàng lọc nhạy'], ['SOX10', 'Marker nhân nhạy'], ['MLA', 'Melan-A, marker biệt hóa melanocytic'], ['MSA', 'HMB-45, marker melanosome'], ['PRAME', 'Hỗ trợ đánh giá ác tính trong bối cảnh phù hợp'], ['CK-PAN', 'Đối chứng cho carcinoma'],
  ]),
  panel('neuroendocrine', 'Biệt hóa thần kinh nội tiết', 'U có hình thái thần kinh nội tiết', 'INSM1 là marker nhân; synaptophysin nhạy; chromogranin A hỗ trợ hạt chế tiết; CD56 nhạy nhưng kém đặc hiệu. Ki-67 dùng phân độ ở một số hệ cơ quan.', [
    ['INSM1', 'Marker nhân thần kinh nội tiết'], ['SYP', 'Marker bào tương dạng hạt nhỏ nhạy'], ['CGA', 'Marker hạt chế tiết'], ['CD56', 'Nhạy nhưng ít đặc hiệu'], ['Ki67', 'Đánh giá tăng sinh theo cơ quan'],
  ]),
  panel('vascular', 'Biệt hóa nội mô', 'U nghi nguồn gốc mạch máu', 'CD31 và ERG thường là cặp bổ trợ mạnh; factor VIII đặc hiệu hơn nhưng kém nhạy ở u biệt hóa kém; CD34 nhạy nhưng biểu hiện ở nhiều u khác.', [
    ['CD31', 'Marker màng/bào tương nội mô'], ['ERG', 'Marker nhân nội mô'], ['FVIII', 'Hỗ trợ biệt hóa nội mô trưởng thành'], ['CD34', 'Nhạy nhưng ít đặc hiệu'],
  ]),
  panel('smooth-muscle', 'Biệt hóa cơ trơn', 'U hình thoi nghi cơ trơn/cơ-sợi', 'SMA nhạy nhưng không đặc hiệu; desmin và myosin cơ trơn chuỗi nặng bổ trợ, trong đó SMH đặc hiệu hơn cho biệt hóa cơ trơn trưởng thành.', [
    ['ASMA', 'Nhạy cho cơ trơn/cơ-sợi'], ['DES', 'Hỗ trợ biệt hóa cơ'], ['SMH', 'Bổ trợ biệt hóa cơ trơn trưởng thành'], ['VIM', 'Marker trung mô nền'],
  ]),
  panel('neural-glial', 'Biệt hóa thần kinh và thần kinh đệm', 'U nghi nguồn gốc glial, Schwann hoặc neuronal', 'GFAP hỗ trợ thần kinh đệm; neurofilament hỗ trợ biệt hóa neuronal/axon; S100 và SOX10 hỗ trợ Schwann nhưng không đặc hiệu tuyệt đối.', [
    ['GFAP', 'Biệt hóa thần kinh đệm'], ['NFP', 'Biệt hóa neuronal/axon'], ['S100', 'Hỗ trợ Schwann/glial'], ['SOX10', 'Hỗ trợ Schwann'], ['VIM', 'Marker trung mô/glial nền'],
  ]),
  panel('germ-cell', 'U tế bào mầm', 'Phân loại u tế bào mầm', 'SALL4 là marker sàng lọc dòng mầm; OCT3/4, PLAP và CD117 hỗ trợ seminoma/dysgerminoma hoặc embryonal carcinoma theo kiểu bắt màu; GPC3 và HCG định hướng thành phần túi noãn hoàng và hợp bào nuôi.', [
    ['SALL4', 'Marker nhân sàng lọc dòng mầm'], ['OCT3/4', 'Seminoma/dysgerminoma và embryonal carcinoma'], ['PLAP', 'Hỗ trợ seminoma/dysgerminoma'], ['CD117', 'Hỗ trợ seminoma/dysgerminoma'], ['GPC3', 'Hỗ trợ u túi noãn hoàng'], ['HCG', 'Hỗ trợ thành phần hợp bào nuôi'],
  ]),
  panel('mmr', 'Bộ bốn protein MMR', 'Đánh giá thiếu hụt sửa chữa bắt cặp sai', 'MLH1 tạo cặp với PMS2; MSH2 tạo cặp với MSH6. Kiểu mất phối hợp giúp định hướng protein chính bị ảnh hưởng, nhưng phải có chứng nội dương và xử lý kết quả không xác định/không đồng nhất.', [
    ['MLH1', 'Protein bắt cặp với PMS2'], ['PMS2', 'Đối tác bắt cặp của MLH1'], ['MSH2', 'Protein bắt cặp với MSH6'], ['MSH6', 'Đối tác bắt cặp của MSH2'],
  ], [nordiqc, capMmr]),
  panel('lymphoid-lineage', 'Phân dòng lympho', 'Tổn thương lympho chưa phân dòng', 'CD45 xác nhận dòng tạo máu; CD3 hỗ trợ dòng T; CD20/PAX5/CD79a/CD19 bổ trợ dòng B. Cần đánh giá cường độ, phân bố và mất marker bất thường.', [
    ['CD45', 'Dòng tạo máu'], ['CD3', 'Dòng T'], ['CD20', 'Dòng B trưởng thành'], ['PAX5', 'Yếu tố phiên mã dòng B'], ['CD79a', 'Dòng B/plasma'], ['CD19', 'Dòng B'],
  ]),
  panel('bcell-subtype', 'Lymphôm tế bào B thường gặp', 'Phân biệt CLL/SLL, mantle cell và follicular/germinal-center', 'CD5/CD23 hỗ trợ CLL/SLL; cyclin D1/SOX11 hỗ trợ mantle cell; CD10/BCL6 hỗ trợ nguồn gốc trung tâm mầm; BCL2 giúp nhận diện biểu hiện bất thường trong nang.', [
    ['CD5', 'Đồng biểu hiện bất thường ở một số lymphoma B'], ['CD23', 'Bổ trợ CLL/SLL'], ['CyD1', 'Hỗ trợ mantle cell lymphoma'], ['SOX11', 'Bổ trợ mantle cell, nhất là cyclin D1 âm'], ['CD10', 'Kiểu trung tâm mầm'], ['Bcl-6', 'Kiểu trung tâm mầm'], ['Bcl-2', 'Chống apoptosis; đọc theo kiến trúc'],
  ]),
  panel('large-bcell', 'Lymphôm tế bào B lớn', 'Định kiểu miễn dịch và tăng sinh', 'CD20/PAX5 xác nhận dòng B; CD10/BCL6/MUM1 mô tả chương trình biệt hóa; MYC/BCL2 và Ki-67 cung cấp thông tin biểu hiện/tăng sinh nhưng không thay thế xét nghiệm tái sắp xếp gen.', [
    ['CD20', 'Dòng B'], ['PAX5', 'Dòng B'], ['CD10', 'Chương trình trung tâm mầm'], ['Bcl-6', 'Chương trình trung tâm mầm'], ['MUM1', 'Biệt hóa hậu trung tâm mầm/plasma'], ['C-MYC', 'Biểu hiện MYC'], ['Bcl-2', 'Biểu hiện BCL2'], ['Ki67', 'Chỉ số tăng sinh'],
  ]),
  panel('hodgkin-alcl', 'Hodgkin hay ALCL', 'Tế bào lớn CD30 dương tính', 'CD30 nhạy nhưng không đặc hiệu; CD15/PAX5 yếu hỗ trợ Hodgkin cổ điển; EMA và marker T hỗ trợ ALCL. Khi cần ALK trong ALCL phải dùng assay đã thẩm định cho bệnh cảnh huyết học, không thay bằng assay ALK dành cho phổi.', [
    ['CD30', 'Marker hoạt hóa chính'], ['CD15', 'Hỗ trợ Hodgkin cổ điển'], ['PAX5', 'Thường yếu ở Hodgkin cổ điển'], ['MUM1', 'Thường biểu hiện nhưng ít đặc hiệu'], ['EMA', 'Có thể hỗ trợ ALCL'], ['CD45', 'Phân dòng tạo máu'], ['CD3', 'Đánh giá kiểu hình T'],
  ]),
  panel('plasma-cell', 'Tương bào và tính đơn dòng', 'Tăng sinh tương bào', 'CD138/MUM1 hỗ trợ nhận diện tương bào; kappa/lambda đánh giá hạn chế chuỗi nhẹ; IgM và CD20 giúp mô tả mức biệt hóa nhưng phải đối chiếu flow cytometry hoặc kỹ thuật khác khi cần.', [
    ['CD138', 'Nhận diện tương bào'], ['MUM1', 'Biệt hóa tương bào'], ['IgK', 'Chuỗi nhẹ kappa'], ['IgL', 'Chuỗi nhẹ lambda'], ['IgM', 'Kiểu immunoglobulin'], ['CD20', 'Dòng B trưởng thành'],
  ]),
  panel('t-nk', 'Dòng T/NK và tiền thân', 'Tổn thương lympho dòng T/NK hoặc non', 'CD3 cùng CD4/CD8/CD5 mô tả dòng T và mất marker; CD56 hỗ trợ NK nhưng không đặc hiệu; TdT hỗ trợ tế bào non. Không kết luận clonality chỉ từ IHC.', [
    ['CD3', 'Dòng T'], ['CD4', 'Phân nhóm T hỗ trợ'], ['CD8', 'Phân nhóm T gây độc'], ['CD5', 'Marker T thường bị mất bất thường'], ['CD56', 'Hỗ trợ NK'], ['TdT', 'Tế bào lympho non'],
  ]),
  panel('histiocytic', 'Dòng mô bào', 'Tổn thương nghi mô bào/đại thực bào', 'CD68 nhạy nhưng ít đặc hiệu; CD163 và CD14 bổ trợ dòng mono-macrophage. S100 có thể dương ở một số quần thể dendritic nhưng cần panel chuyên biệt.', [
    ['CD68', 'Marker lysosome, nhạy'], ['CD163', 'Hỗ trợ biệt hóa mô bào'], ['CD14', 'Hỗ trợ dòng mono-macrophage'], ['S100', 'Hỗ trợ một số tế bào dendritic'],
  ]),
  panel('small-round-cell', 'U tế bào tròn nhỏ', 'U tế bào tròn nhỏ chưa rõ dòng', 'Panel phân nhánh biểu mô, tạo máu, melanocytic/thần kinh, cơ và tế bào mầm; CD99 chỉ là marker sàng lọc và không đủ chẩn đoán Ewing sarcoma.', [
    ['CD99', 'Marker màng nhạy nhưng ít đặc hiệu'], ['CK-PAN', 'Biểu mô'], ['CD45', 'Tạo máu'], ['DES', 'Cơ'], ['S100', 'Melanocytic/thần kinh'], ['SOX10', 'Melanocytic/Schwann'], ['SALL4', 'Tế bào mầm'], ['WT1', 'Đọc theo clone và vị trí bắt màu'],
  ]),
  panel('mullerian', 'U Müller và buồng trứng', 'Phân loại carcinoma phụ khoa', 'PAX8 xác nhận dòng Müller; WT1/ER hỗ trợ kiểu thanh dịch; p53 và p16 mô tả kiểu phân tử/HPV liên quan theo bối cảnh; Napsin A và HNF1B (nếu có) hỗ trợ tế bào sáng.', [
    ['PAX8', 'Dòng Müller'], ['WT1', 'Hỗ trợ thanh dịch'], ['ER', 'Hỗ trợ kiểu nội mạc/ thanh dịch độ thấp'], ['PR', 'Bổ trợ nội tiết'], ['p53', 'Kiểu biểu hiện đột biến hoặc hoang dại'], ['p16', 'Kiểu block hoặc không block theo bối cảnh'], ['Napsin A', 'Hỗ trợ carcinoma tế bào sáng'], ['CA125', 'Hỗ trợ Müller'],
  ]),
  panel('cervix-hpv', 'Tổn thương liên quan HPV', 'Đánh giá tổn thương biểu mô cổ tử cung/đầu cổ theo bối cảnh', 'p16 dạng block là dấu thay thế cho HPV hoạt động trong các chỉ định xác định; p40/p63/CK5 hỗ trợ biệt hóa vảy. p16 không phải xét nghiệm HPV trực tiếp.', [
    ['p16', 'Kiểu block trong chỉ định phù hợp'], ['p40', 'Biệt hóa vảy'], ['p63', 'Biệt hóa vảy/basal'], ['CK5', 'Biệt hóa vảy/basal'], ['Ki67', 'Phân bố tăng sinh bất thường hỗ trợ'],
  ]),
  panel('trophoblastic', 'Tổn thương nguyên bào nuôi', 'Thai trứng và u nguyên bào nuôi', 'p57 phản ánh biểu hiện alen mẹ và hỗ trợ phân biệt thai trứng toàn phần với các tình huống khác; hCG hỗ trợ hợp bào nuôi. Cần tích hợp hình thái, ploidy/genotyping khi cần.', [
    ['p57', 'Mất nhân hỗ trợ thai trứng toàn phần trong bối cảnh phù hợp'], ['HCG', 'Hỗ trợ hợp bào nuôi'], ['SALL4', 'Hỗ trợ thành phần tế bào mầm/túi noãn hoàng'], ['Ki67', 'Mô tả tăng sinh, không chẩn đoán đơn độc'],
  ]),
  panel('predictive-cdx', 'Dấu ấn dự báo phụ thuộc assay', 'Chọn điều trị đích hoặc miễn dịch', 'Mỗi marker phải dùng đúng clone, nền tảng, thuật toán, loại bệnh phẩm và ngưỡng của chỉ định. Không ghép điểm số giữa các assay hoặc cơ quan.', [
    ['ALK (lung)', 'ALK rearrangement/protein expression trong NSCLC'], ['HER2 IHC', 'Biểu hiện protein HER2'], ['HER2 ISH', 'Khuếch đại ERBB2'], ['PD-L1 (IC)', 'Tỷ lệ tế bào miễn dịch theo assay/chỉ định'], ['PD-L1 (TPS/CPS)', 'TPS hoặc CPS theo assay/chỉ định'], ['CLDN18.2', 'Biểu hiện màng phụ thuộc assay'], ['FOLR1', 'Biểu hiện màng trong chỉ định phụ khoa'], ['BRAF', 'Protein BRAF V600E trong chỉ định phù hợp'],
  ], [nordiqc, fdaCdx]),
  panel('cell-cycle', 'Chu kỳ tế bào và tăng sinh', 'Đánh giá kiểu biểu hiện bất thường và hoạt tính tăng sinh', 'Ki-67 mô tả tỷ lệ tăng sinh; p53 và p16 được đọc theo kiểu hình, không chỉ dương/âm; cyclin D1, MYC, BCL2/BCL6 có ý nghĩa phụ thuộc thực thể và kiến trúc.', [
    ['Ki67', 'Tỷ lệ nhân tăng sinh'], ['p53', 'Kiểu biểu hiện, không phải xét nghiệm trình tự trực tiếp'], ['p16', 'Kiểu block/mosaic/mất tùy bối cảnh'], ['CyD1', 'Chu kỳ tế bào'], ['C-MYC', 'Yếu tố phiên mã tăng sinh'], ['Bcl-2', 'Chống apoptosis'], ['Bcl-6', 'Chương trình trung tâm mầm'], ['BRAF', 'Dấu thay thế V600E trong assay phù hợp'],
  ]),
]

export const IHC_PANEL_REFERENCES = [
  { organization: 'NordiQC', title: 'Danh mục ngoại kiểm và protocol HMMD', url: nordiqc },
  { organization: 'WHO/IARC', title: 'WHO Classification of Tumours Online', url: 'https://tumourclassification.iarc.who.int/' },
  { organization: 'College of American Pathologists', title: 'Danh mục hướng dẫn xét nghiệm và biomarker', url: 'https://www.cap.org/protocols-and-guidelines/cap-guidelines/current-cap-guidelines/' },
  { organization: 'U.S. FDA', title: 'Danh sách companion diagnostic được cấp phép', url: fdaCdx },
  { organization: 'Human Protein Atlas', title: 'Tissue Atlas và phương pháp IHC', url: 'https://www.proteinatlas.org/humanproteome/tissue/method/ih%2Bimaging' },
  { organization: 'Human Protein Atlas', title: 'Giấy phép dữ liệu và hình ảnh', url: 'https://www.proteinatlas.org/about/licence' },
  { organization: 'ICCR', title: 'Bộ dữ liệu báo cáo ung thư quốc tế', url: 'https://www.iccr-cancer.org/datasets/published-datasets/' },
  { organization: 'PathologyOutlines', title: 'Danh mục stains và marker chẩn đoán', url: 'https://www.pathologyoutlines.com/stains.html' },
  { organization: 'RCPAQAP', title: 'Special stains and immunohistochemistry resources', url: 'https://specialstains.rcpaqap.com.au/' },
] as const

export const panelsForMarker = (marker: string) => IHC_DIAGNOSTIC_PANELS.filter(item =>
  item.members.some(member => member.marker === marker),
)
