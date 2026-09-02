export interface IhcMarkerEvidence {
  localization: string
  positive: string
  negative: string
  control: string
  indications: string[]
  pitfalls: string[]
  evidenceLabel: string
}

const nordiqcEvidence = (
  localization: string,
  positive: string,
  negative: string,
  control: string,
  indications: string[],
  pitfalls: string[],
): IhcMarkerEvidence => ({
  localization,
  positive,
  negative,
  control,
  indications,
  pitfalls,
  evidenceLabel: 'Đã đối chiếu tiêu chí và mô chứng trong báo cáo NordiQC mới nhất',
})

export const IHC_MARKER_EVIDENCE: Record<string, IhcMarkerEvidence> = {
  AMACR: nordiqcEvidence(
    'Bào tương dạng hạt',
    'Trong ung thư biểu mô tuyến tiền liệt, tế bào u thường bắt màu bào tương dạng hạt rõ, từ yếu đến mạnh. Đây là marker dương hỗ trợ và phải được đọc cùng hình thái cũng như marker tế bào đáy.',
    'Tuyến tiền liệt tăng sản thường âm tính hoặc chỉ bắt màu khu trú, yếu. AMACR âm tính không loại trừ ung thư biểu mô tuyến tiền liệt; AMACR dương tính cũng không đặc hiệu tuyệt đối cho ác tính.',
    'Thận là chứng dương phù hợp: biểu mô ống lượn gần phải bắt màu dạng hạt vừa đến mạnh; phần lớn ống lượn xa và một số tế bào lá thành bao Bowman bắt màu yếu. Tuyến tiền liệt lành là chứng âm, có thể chỉ bắt màu khu trú yếu.',
    [
      'Hỗ trợ phân biệt tuyến tiền liệt lành hoặc tân sản nội biểu mô tuyến tiền liệt với ung thư biểu mô tuyến tiền liệt.',
      'Dùng trong cocktail PIN cùng p63 và/hoặc cytokeratin trọng lượng phân tử cao khi đánh giá một ổ tuyến nhỏ nghi ngờ.',
    ],
    [
      'Không kết luận ung thư chỉ vì AMACR dương tính; một số tổn thương lành và tân sản nội biểu mô cũng có thể biểu hiện.',
      'Phải nhận diện riêng tín hiệu AMACR với tín hiệu của marker tế bào đáy trong cocktail đa kháng thể.',
    ],
  ),
  BAP1: nordiqcEvidence(
    'Nhân',
    'Biểu hiện nhân được bảo tồn khi nhân tế bào u bắt màu rõ. Trong đánh giá mesothelioma, mất hoàn toàn biểu hiện nhân ở tế bào u, trong khi tế bào mô đệm hoặc tế bào không u còn dương tính, là kiểu bất thường có giá trị hỗ trợ ác tính.',
    '“Âm tính” có ý nghĩa là mất biểu hiện nhân thật sự trong tế bào u với chứng nội dương. Biểu hiện BAP1 còn bảo tồn không loại trừ mesothelioma ác tính vì độ nhạy của hiện tượng mất BAP1 không tuyệt đối.',
    'Amidan và ruột thừa cung cấp nhiều quần thể chứng dương nhân; trong mô u, tế bào mô đệm còn bắt màu là chứng nội quan trọng trước khi gọi mất BAP1.',
    [
      'Hỗ trợ phân biệt mesothelioma ác tính với tăng sản trung biểu mô phản ứng trong một panel phù hợp.',
      'Đánh giá mất BAP1 trong các bối cảnh u khác phải theo tiêu chí chuyên biệt của từng thực thể, không suy diễn từ thuật toán mesothelioma.',
    ],
    [
      'Không tính bắt màu bào tương là biểu hiện nhân được bảo tồn.',
      'Không gọi mất biểu hiện khi tế bào mô đệm, lympho bào hoặc chứng ngoài cũng không bắt màu.',
    ],
  ),
  BRAF: nordiqcEvidence(
    'Bào tương',
    'Với kháng thể đặc hiệu BRAF V600E đã thẩm định, tín hiệu bào tương rõ, không nhập nhằng trong tế bào u hỗ trợ sự hiện diện của đột biến BRAF V600E ở các chỉ định phù hợp như melanoma và ung thư biểu mô tuyến đại trực tràng.',
    'Không có tín hiệu bào tương đặc hiệu phù hợp với kiểu âm tính của hệ thống xét nghiệm. Kết quả âm tính không loại trừ các biến thể BRAF ngoài V600E và không thay thế xét nghiệm phân tử khi kết quả bất tương hợp.',
    'Nên dùng mô u đã biết trạng thái BRAF V600E dương và âm. Biểu mô ruột thừa bình thường thường âm hoặc chỉ có tín hiệu bào tương rất nhạt; bắt màu cơ trơn yếu và tín hiệu nhân có thể gặp tùy hệ thống xét nghiệm.',
    [
      'Sàng lọc protein BRAF V600E trong melanoma hoặc ung thư biểu mô tuyến đại trực tràng bằng clone và quy trình đã thẩm định.',
      'Hỗ trợ thuật toán phân tử hoặc điều trị đích khi hướng dẫn của cơ quan và chỉ định cho phép.',
    ],
    [
      'BRAF VE1 không phải xét nghiệm cho mọi biến thể BRAF.',
      'Tín hiệu nhân, nền bẩn hoặc bắt màu bào tương rất nhạt không được tự động gọi dương tính.',
    ],
  ),
  CDX2: nordiqcEvidence(
    'Nhân',
    'Bắt màu nhân lan tỏa và rõ hỗ trợ biệt hóa ruột; ung thư biểu mô tuyến đại trực tràng thường biểu hiện mạnh, nhưng mức độ có thể giảm ở u biệt hóa kém hoặc một số phân nhóm phân tử.',
    'Âm tính không loại trừ tuyệt đối nguồn gốc tiêu hóa. CDX2 dương tính cũng không đồng nghĩa chắc chắn nguồn gốc đại trực tràng vì có thể gặp ở các carcinoma biệt hóa kiểu ruột ngoài đại trực tràng.',
    'Biểu mô ruột thừa là chứng dương mạnh. Biểu mô ống tụy có thể bắt màu nhân yếu đến vừa và giúp kiểm tra độ nhạy thấp; mô u phổi âm đã biết có thể hỗ trợ đánh giá độ đặc hiệu.',
    [
      'Đánh giá biệt hóa ruột và định hướng nguồn gốc đại trực tràng ở carcinoma chưa rõ nguyên phát.',
      'Phối hợp SATB2, CK20, CK7 và hình thái để tăng độ đặc hiệu cho nguồn gốc đại trực tràng.',
    ],
    [
      'Chỉ tính tín hiệu nhân; bắt màu bào tương đơn độc không phải kiểu đọc chính.',
      'Không dùng CDX2 đơn độc để gán cơ quan nguyên phát.',
    ],
  ),
  DOG1: nordiqcEvidence(
    'Màng tế bào, thường kèm bào tương',
    'GIST thường cho tín hiệu màng rõ, có thể kèm bào tương, từ vừa đến mạnh trong phần lớn tế bào u. DOG1 và CD117 bổ trợ nhau khi một marker yếu hoặc âm tính.',
    'DOG1 âm tính không loại trừ hoàn toàn GIST. Trong báo cáo ngoại kiểm, leiomyosarcoma được dùng làm mô u âm; chẩn đoán vẫn phải dựa vào hình thái và panel cơ trơn/Schwann khi cần.',
    'Tế bào kẽ Cajal ở ruột thừa là chứng dương nhạy, bắt màu màng rõ. Biểu mô đáy hốc tuyến, nội mô và cơ trơn mạch có thể bắt màu yếu và không nên bị diễn giải nhầm.',
    [
      'Hỗ trợ chẩn đoán u mô đệm đường tiêu hóa, đặc biệt khi phối hợp CD117 và CD34.',
      'Phân biệt GIST với u cơ trơn hoặc u bao dây thần kinh bằng panel DOG1, CD117, desmin, SMA và S100/SOX10.',
    ],
    [
      'DOG1 không hoàn toàn đặc hiệu cho GIST và kiểu bắt màu có thể phụ thuộc clone.',
      'Tín hiệu ở tế bào Cajal hoặc biểu mô hốc tuyến là chứng sinh học, không phải tổn thương u.',
    ],
  ),
  GATA3: nordiqcEvidence(
    'Nhân',
    'Bắt màu nhân trong tế bào u hỗ trợ biệt hóa tuyến vú hoặc biểu mô đường niệu (niệu mạc) trong đúng bối cảnh. Carcinôm đường niệu thường biểu hiện rộng; ung thư vú bộ ba âm tính có thể biểu hiện yếu hoặc không đồng nhất.',
    'Âm tính không loại trừ nguồn gốc vú, đặc biệt ở carcinôm vú bộ ba âm tính, và không loại trừ carcinôm đường niệu biệt hóa kém. Dương tính cũng không đặc hiệu tuyệt đối cho hai nguồn gốc này.',
    'Tế bào podocyte và biểu mô ống góp ở thận, tế bào T hỗ trợ ở amidan và biểu mô lát vùng đáy-trung gian cổ tử cung là các quần thể chứng dương. Carcinoma phổi âm đã biết hỗ trợ đánh giá độ đặc hiệu.',
    [
      'Định hướng nguồn gốc vú hoặc biểu mô đường niệu trong carcinôm chưa rõ nguyên phát.',
      'Phối hợp TRPS1, mammaglobin, GCDFP-15, ER/PR cho nguồn gốc vú; phối hợp uroplakin II/III, p63/p40 và CK7/CK20 cho nguồn gốc biểu mô đường niệu.',
    ],
    [
      'Không gán nguồn gốc vú hoặc biểu mô đường niệu chỉ dựa trên GATA3.',
      'Chỉ tính tín hiệu nhân; nền bào tương không phải tín hiệu đặc hiệu.',
    ],
  ),
  'NKX3.1': nordiqcEvidence(
    'Nhân',
    'Tín hiệu nhân rõ trong tế bào u hỗ trợ mạnh nguồn gốc tuyến tiền liệt, kể cả khi PSA hoặc PAP giảm ở carcinoma biệt hóa kém.',
    'Âm tính làm giảm khả năng nguồn gốc tuyến tiền liệt nhưng không loại trừ tuyệt đối. Phải đọc cùng PSA, PAP, P501S, hình thái và tiền sử điều trị.',
    'Biểu mô lòng tuyến tiền liệt tăng sản là chứng dương mạnh; tế bào Sertoli bắt màu yếu đến vừa có thể giúp kiểm tra độ nhạy. Biểu mô ruột thừa và carcinoma đại tràng âm đã biết hỗ trợ độ đặc hiệu.',
    [
      'Xác định nguồn gốc tuyến tiền liệt ở carcinoma di căn hoặc carcinoma chưa rõ nguyên phát.',
      'Bổ trợ PSA/PAP/P501S khi khối u biệt hóa kém hoặc đã điều trị.',
    ],
    [
      'Chỉ đọc tín hiệu nhân; bắt màu bào tương đi kèm không phải tiêu chí chính.',
      'Không dùng một marker đơn độc để quyết định nguồn gốc khi hình thái và lâm sàng không phù hợp.',
    ],
  ),
  p16: nordiqcEvidence(
    'Nhân và bào tương',
    'Kiểu “block” là bắt màu nhân và bào tương mạnh, liên tục trong quần thể tế bào tổn thương theo tiêu chí của từng cơ quan. Trong chỉ định phù hợp, kiểu này hỗ trợ tổn thương liên quan HPV hoạt động.',
    'Kiểu rải rác, loang lổ hoặc không liên tục không tương đương kiểu block. p16 âm tính không tự loại trừ HPV và p16 dương tính không phải xét nghiệm phát hiện HPV trực tiếp.',
    'Amidan cung cấp tế bào biểu mô hốc, đại thực bào hoặc tế bào tua rải rác bắt màu; biểu mô lát cổ tử cung bình thường phần lớn âm. Nên có mô tổn thương dương kiểu block đã biết khi thẩm định.',
    [
      'Hỗ trợ đánh giá tổn thương biểu mô cổ tử cung và một số carcinoma tế bào vảy đầu cổ theo đúng chỉ định.',
      'Đọc cùng p40/p63/CK5, hình thái và xét nghiệm HPV khi thuật toán yêu cầu.',
    ],
    [
      'Không áp dụng một định nghĩa “dương tính” duy nhất cho mọi cơ quan.',
      'Tín hiệu khu trú hoặc chỉ bào tương không được gọi là kiểu block.',
    ],
  ),
  p53: nordiqcEvidence(
    'Nhân',
    'Kiểu biểu hiện bất thường thường gồm quá biểu hiện nhân lan tỏa, mạnh hoặc kiểu mất hoàn toàn trong tế bào u với chứng nội còn dương. Kiểu hoang dại có cường độ và tỷ lệ không đồng nhất.',
    'Không gọi kiểu “null” nếu tế bào mô đệm, lympho bào hoặc biểu mô lành kèm theo cũng âm. p53 IHC là dấu thay thế kiểu đột biến trong các bối cảnh đã xác lập, không phải xét nghiệm giải trình tự TP53.',
    'Tế bào B trung tâm mầm ở amidan và các tế bào biểu mô rải rác vùng đáy hốc ruột thừa phải có tín hiệu nhân yếu đến vừa, tạo chứng dương sinh lý cho hệ thống xét nghiệm.',
    [
      'Đánh giá kiểu biểu hiện p53 trong carcinoma nội mạc tử cung và các u phụ khoa khi hệ thống phân loại yêu cầu.',
      'Phối hợp p16, marker dòng Müller và hình thái; dùng xét nghiệm phân tử khi kiểu nhuộm không rõ hoặc bất tương hợp.',
    ],
    [
      'Không báo cáo p53 đơn thuần theo “dương/âm”; cần mô tả kiểu hoang dại, quá biểu hiện, mất hoàn toàn hoặc không xác định.',
      'Bắt màu khu trú mạnh không tự đủ để gọi kiểu quá biểu hiện.',
    ],
  ),
  SATB2: nordiqcEvidence(
    'Nhân',
    'Bắt màu nhân lan tỏa, rõ trong carcinoma tuyến đại trực tràng hỗ trợ nguồn gốc đại trực tràng. SATB2 cũng có thể biểu hiện ở một số tân sinh thần kinh nội tiết và các dòng biệt hóa khác nên phải dùng theo panel.',
    'Âm tính không loại trừ hoàn toàn carcinoma đại trực tràng, nhất là u biệt hóa kém. Dương tính không tự xác định vị trí nguyên phát.',
    'Biểu mô ruột thừa là chứng dương mạnh; tế bào hạch rải rác, một phần lympho bào amidan và tế bào mầm tinh hoàn có thể bắt màu. Cơ trơn ruột thừa và phần lớn lympho bào phải âm.',
    [
      'Định hướng nguồn gốc đại trực tràng trong carcinoma chưa rõ nguyên phát.',
      'Phối hợp CDX2, CK20, CK7 và CEA để cân bằng độ nhạy với độ đặc hiệu.',
    ],
    [
      'Không diễn giải SATB2 ngoài bối cảnh hình thái và cơ quan vì marker này không tuyệt đối đặc hiệu.',
      'Chỉ tính tín hiệu nhân trong đúng quần thể tế bào u.',
    ],
  ),
  SOX10: nordiqcEvidence(
    'Nhân',
    'Tín hiệu nhân hỗ trợ dòng melanocytic, Schwann hoặc myoepithelial. Melanoma và một tỷ lệ carcinoma vú bộ ba âm tính có thể biểu hiện mạnh, nhưng ý nghĩa phụ thuộc hình thái và panel.',
    'SOX10 âm tính không loại trừ hoàn toàn melanoma hoặc carcinoma vú bộ ba âm tính. Dương tính không phân biệt được giữa melanoma, u Schwann và biệt hóa myoepithelial nếu thiếu marker bổ trợ.',
    'Melanocyte ở da và tế bào Schwann ở ruột thừa là chứng dương mạnh; tế bào cơ-biểu mô tuyến mồ hôi cũng bắt màu. Carcinoma đại tràng âm đã biết hỗ trợ đánh giá độ đặc hiệu.',
    [
      'Xác nhận dòng melanocytic hoặc Schwann trong u chưa rõ biệt hóa.',
      'Bổ trợ GATA3/TRPS1 ở carcinoma vú bộ ba âm tính trong đúng bối cảnh.',
    ],
    [
      'Không phân loại u chỉ bằng SOX10; cần phối hợp S100, Melan-A/HMB45/PRAME hoặc marker biểu mô tùy câu hỏi.',
      'Chỉ đọc tín hiệu nhân; nền bào tương không phải tiêu chí dương tính chính.',
    ],
  ),
  WT1: nordiqcEvidence(
    'Nhân',
    'Bắt màu nhân hỗ trợ carcinoma thanh dịch buồng trứng/vòi tử cung và mesothelioma trong panel phù hợp. Ý nghĩa thay đổi theo thực thể và clone sử dụng.',
    'WT1 âm tính không loại trừ tuyệt đối nguồn gốc Müller hoặc trung biểu mô. Carcinoma tuyến phổi thường âm trong panel phân biệt với mesothelioma nhưng không được dùng WT1 đơn độc.',
    'Biểu mô và cơ trơn vòi tử cung, podocyte và tế bào lá thành cầu thận là chứng dương nhân phù hợp. Ống thận và carcinoma tuyến phổi âm đã biết hỗ trợ đánh giá độ đặc hiệu.',
    [
      'Hỗ trợ phân loại carcinoma thanh dịch vùng Müller khi phối hợp PAX8, ER và p53.',
      'Hỗ trợ phân biệt mesothelioma với carcinoma tuyến khi phối hợp calretinin, podoplanin, CK5, claudin-4 và marker biểu mô.',
    ],
    [
      'Phải nêu clone và vị trí bắt màu; tín hiệu bào tương của một số clone không tương đương tín hiệu nhân.',
      'WT1 không đặc hiệu tuyệt đối cho u Müller hoặc mesothelioma.',
    ],
  ),
}

export const markerEvidenceFor = (marker: string) => IHC_MARKER_EVIDENCE[marker]

