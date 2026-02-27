// EventGuidePage - Trang hiển thị Event Department Guide
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { PositionCard, ActivityList, SectionAccordion } from '../components/EventGuide';

const EventGuidePage = () => {
  const [expanded, setExpanded] = useState('planning-team');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  return (
    <Box sx={{ pb: 8, maxWidth: 900 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
          Event Department Guides
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Cẩm nang tổ chức sự kiện - Ban Event CSG
        </Typography>
      </Box>

      {/* Intro */}
      <Box
        sx={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 2,
          p: 3,
          mb: 4
        }}
      >
        <Typography variant="body2" sx={{ color: '#999', lineHeight: 1.7, mb: 2 }}>
          Cẩm nang "Event Department Guides" được xây dựng như một khung hướng dẫn vận hành chuẩn hóa, nhằm nâng cao tính hiệu quả, tính nhất quán và tính chuyên nghiệp trong toàn bộ quá trình tổ chức các sự kiện thuộc phạm vi dự án Cóc Sài Gòn. Đây là cẩm nang toàn diện, định hướng cụ thể cho các team trong Ban Event: Planning, Event Production và Paperwork.
        </Typography>
        <Typography variant="body2" sx={{ color: '#999', lineHeight: 1.7, mb: 2 }}>
          Mục tiêu cốt lõi của cẩm nang là xác lập rõ ràng vai trò, phạm vi công việc của từng vị trí; chuẩn hóa quy trình triển khai theo từng giai đoạn từ lên ý tưởng, tiền sản xuất, đến triển khai thực tế; đồng thời đảm bảo sự phối hợp nhịp nhàng giữa các team. Cẩm nang đi kèm các liên kết template cần thiết như: Master Sheet, Agenda, Timeline, Checklist, Biên bản họp...
        </Typography>
        <Typography variant="body2" sx={{ color: '#999', lineHeight: 1.7, mb: 2 }}>
          Tổng thể, Event Department Guides không chỉ đóng vai trò như một cẩm nang chiến lược và vận hành cho Ban Event, mà còn góp phần xây dựng văn hóa làm việc chuyên nghiệp, minh bạch và chủ động.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="Planning" size="small" sx={{ background: '#1a1a1a', color: '#FF6B6B', border: '1px solid #2a2a2a', fontSize: '0.75rem' }} />
          <Chip label="Event Production" size="small" sx={{ background: '#1a1a1a', color: '#4ECDC4', border: '1px solid #2a2a2a', fontSize: '0.75rem' }} />
          <Chip label="Paperwork" size="small" sx={{ background: '#1a1a1a', color: '#9B59B6', border: '1px solid #2a2a2a', fontSize: '0.75rem' }} />
        </Box>
      </Box>

      {/* A. GIAI ĐOẠN PLANNING */}
      <Typography
        variant="caption"
        sx={{ color: '#666', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}
      >
        A. Giai đoạn Planning
      </Typography>

      {/* Team Planning */}
      <SectionAccordion id="planning-team" title="Team Planning" color="#FF6B6B" expanded={expanded} handleChange={handleChange}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', lineHeight: 1.7, mb: 3, pl: 2, borderLeft: '2px solid #2a2a2a' }}>
            Planning hướng tới việc kiến tạo những kế hoạch táo bạo, nơi các thành viên được thỏa sức bùng nổ ý tưởng và biến những khát vọng táo bạo thành hiện thực.
          </Typography>

          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Vị trí
          </Typography>

          <PositionCard
            title="Planning Leader"
            quantity="1 thành viên"
            duties="Planning Leader trong tổ chức sự kiện đóng vai trò quan trọng trong việc định hướng, quản lý và kết nối các khâu tổ chức để đảm bảo sự kiện diễn ra thành công. Họ chịu trách nhiệm chính trong việc lên ý tưởng, xây dựng kế hoạch chi tiết, xác định mục tiêu, chủ đề và nội dung, đồng thời dự đoán rủi ro để sự kiện diễn ra suôn sẻ. Sau dự án, họ tổng hợp phản hồi, đánh giá hiệu quả và rút kinh nghiệm cho những lần tổ chức sau. Đồng thời, Planning Leader cũng là người gắn kết các thành viên trong team, tạo nên một môi trường sáng tạo và đầy nhiệt huyết."
          />

          <PositionCard
            title="Planning Members"
            quantity="Trung bình 4-5 thành viên, số lượng tùy thuộc vào quy mô của dự án"
            duties="Planning Member đóng vai trò hỗ trợ quan trọng trong quá trình tổ chức sự kiện, đặc biệt trong việc đóng góp ý tưởng cho sự kiện và đảm bảo các hạng mục trong kế hoạch được triển khai hiệu quả. Họ tham gia vào quá trình brainstorming, đề xuất các ý tưởng sáng tạo để phát triển nội dung và concept dự án. Đồng thời, Planning Member cũng hỗ trợ scout giá cho các hạng mục trong bảng kế hoạch, tìm kiếm, so sánh và đề xuất các phương án tối ưu về chi phí, đảm bảo ngân sách được sử dụng hợp lý. Sự phối hợp chặt chẽ giữa Planning Member và Planning Leader giúp kế hoạch trở nên hoàn thiện, thực tế và khả thi hơn."
          />

          <Box sx={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 1.5, p: 2, mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#666' }}>Thời gian hoạt động</Typography>
            <Typography variant="body2" sx={{ color: '#FFD700', mt: 0.5 }}>1 - 2 tháng</Typography>
          </Box>

          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Hoạt động
          </Typography>
          <ActivityList activities={[
            "Lập group và giới thiệu",
            "Task Peer Review",
            "Kickoff offline (bắt buộc): Nội dung họp: trình bày và trao đổi về Peer Review (các dự án cùng tính chất) + những thông tin cơ bản về dự án (thời gian, địa điểm, budget, định hướng chung các hoạt động trong dự án)",
            "Brainstorm concept (nếu cần) + các hoạt động trong dự án",
            "Brainstorm tên cho sự kiện và các hoạt động trong dự án",
            "Chốt Concept + Hoạt động + Tên dự án và hoạt động",
            "Scout giá các hạng mục trong bản kế hoạch với Core Team Event (dựa vào PaperWork Talk)"
          ]} />
        </Box>
      </SectionAccordion>

      {/* Team Event Production (Planning) */}
      <SectionAccordion id="event-production-planning" title="Team Event Production" color="#4ECDC4" expanded={expanded} handleChange={handleChange}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', lineHeight: 1.7, mb: 3, pl: 2, borderLeft: '2px solid #2a2a2a' }}>
            Là một phần của dự án, là sự đảm bảo cho thành công. Phối hợp cùng với các team khác để thực hiện dự án. Đảm nhận phần thực hiện kế hoạch, tổ chức sự kiện.
          </Typography>

          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Vị trí
          </Typography>

          <PositionCard
            title="Event Leader"
            quantity="1 thành viên"
            duties="Tạo sự kết nối trong Core Event, trong Event, và kết nối với các team khác của dự án, vạch ra các công việc cần làm của team, quản lý team, quản lý tiến độ các công việc của Event..."
          />

          <Box sx={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 1.5, p: 2, mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ứng tuyển</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              • Group Messenger Event Production<br />
              • Group Facebook Gia đình Cóc Sài Gòn
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mt: 1.5, display: 'block' }}>Yêu cầu</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              Chú tâm, chủ động, nghiêm túc, chia đều công việc và có tinh thần hỗ trợ lẫn nhau trong team và trong dự án.
            </Typography>
          </Box>

          <PositionCard
            title="Event Sub-Leader(s)"
            quantity="1 - 2 thành viên (có thể tùy vào quy mô của dự án mà sẽ có hay không có Event Sub-Leader)"
            duties="Tạo sự kết nối trong Core Event, trong Event, và kết nối với các team khác của dự án, hỗ trợ Leader, quản lý tiến độ các công việc của Event..."
          />

          <Box sx={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 1.5, p: 2, mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ứng tuyển</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              • Group Messenger Event Production<br />
              • Group Facebook Gia đình Cóc Sài Gòn
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mt: 1.5, display: 'block' }}>Yêu cầu</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              Chú tâm, chủ động, nghiêm túc, chia đều công việc và có tinh thần hỗ trợ lẫn nhau trong team và trong dự án.
            </Typography>
          </Box>

          <PositionCard
            title="Event Member(s)"
            quantity="Vô định, trung bình khoảng 10 đến 20+ thành viên (tùy thuộc vào khối lượng công việc của sự kiện để tuyển)"
            duties="Thực hiện các công việc Core Event giao phó, hỗ trợ hết mình cho dự án, giúp đỡ lẫn nhau."
          />

          <Box sx={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 1.5, p: 2, mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ứng tuyển</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              • Group Messenger Event Production<br />
              • Group Facebook Gia đình Cóc Sài Gòn
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mt: 1.5, display: 'block' }}>Yêu cầu</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              Nghiêm túc, tuân thủ, vui vẻ.
            </Typography>
          </Box>

          <PositionCard
            title="Event Mentor(s)"
            quantity="1 - 2 thành viên"
            duties="Hướng dẫn và hỗ trợ Event Leader và Sub-Leaders làm việc, cung cấp các tài liệu tham khảo cần thiết theo yêu cầu của Event Leader và Sub-Leaders hoặc tự chủ động, quan sát và phản hồi về tình hình Event, cố gắng giúp Core Event đảm bảo được tiến độ sự kiện..."
          />

          <Box sx={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 1.5, p: 2, mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ứng tuyển</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              Tự ứng cử với Core Event Production hoặc được Core Event Production mời, chỉ định.
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mt: 1.5, display: 'block' }}>Yêu cầu</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              Sẵn sàng hỗ trợ Event Leader và Sub-Leaders, quan tâm tình hình Event.
            </Typography>
          </Box>

          <Box sx={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 1.5, p: 2, mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#666' }}>Thời gian hoạt động</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5, mb: 1 }}>
              Core Event (Leader, Sub-Leaders và Mentors): Được thành lập khoảng <span style={{ color: '#FFD700' }}>2 tuần</span> sau khi Team Planning thành lập (nếu Team Planning thành lập trễ, thì Core Event phải thành lập ngay khi Planning tuyển để kịp tiến độ).
            </Typography>
            <Typography variant="body2" sx={{ color: '#999' }}>
              Event Members Group: Được tuyển và thành lập tùy vào khối lượng công việc cần hoàn thành. Trung bình Group sẽ được thành lập sau khi Plan được ký và trước khi sự kiện diễn ra từ <span style={{ color: '#FFD700' }}>1 - 1.5 tuần</span>.
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Hoạt động
          </Typography>
          <ActivityList activities={[
            "Event Mentor hoặc Project Leader lập group Core Event (bao gồm Project Leader, Project Sub-Leader(s), Project Mentor(s), Event Leader, Event Sub-Leader(s), Event Mentor(s), Trưởng Ban Event, Phó Ban Event, Event Production Leader)",
            "Core Event hoặc Project Leader lập Event Folder trong Folder dự án. Và Core Event lập Event Master Sheet trong Event Folder",
            "Tổ chức kick-off meeting để giao lưu và quen biết nhau, vạch ra công việc trước mắt cần làm. Tất cả nội dung cuộc họp về công việc đều phải được một đại diện ghi lại bằng Biên bản họp",
            "Lập tab Task Delegation trong Event Master Sheet để phân công nhiệm vụ cho Team Event",
            "Tham gia vào Team Planning của dự án để nắm thông tin dự án. Cùng bàn bạc kế hoạch với Team Planning (lưu ý: mức độ khả thi Plan, tôn trọng nhau...)",
            "Lên Timeline Tổng quan toàn sự kiện (nhân sự, setup, rehearsal, onsite,...). Timeline sẽ lên theo khoảng thời gian dài (từ lúc lập Core Event đến khi kết thúc sự kiện), liệt kê ra các công việc theo thời gian ngày để đảm bảo tiến độ",
            "Lập Checklist các đồ dùng cần thiết cho dự án (xem chi tiết bên dưới)",
            "Cùng Team Planning scout giá các vật dụng theo Checklist để hoàn thành Bảng Kinh phí trong Plan",
            "Lập Checklist Event x Media trong Project Master Sheet. Cần phối hợp xuyên suốt với Team Media để đảm bảo tiến độ và chất lượng công việc",
            "Tạo sự kiện trên lu.ma để cho người tham gia đăng ký (đối với các buổi biểu diễn nghệ thuật) hoặc tạo Form Đăng ký cho người tham gia (đối với các hoạt động giải trí khác) và Form Feedback cho các hoạt động của sự kiện",
            "Lên Quy trình cho các hoạt động. Quy trình sẽ cho Team Event biết các bước cần làm trong ngày onsite để việc tổ chức suôn sẻ hơn",
            "Lên Agenda cho ngày Rehearsal và ngày Onsite. Agenda sẽ lên theo khoảng thời gian ngắn (chỉ trong ngày Rehearsal và ngày Onsite), để nắm rõ chi tiết các công việc cần làm và người phụ trách các công việc đó theo thời gian giờ",
            "Lên Kịch bản Master cho ngày Onsite. Kịch bản Master dùng để tổ chức các buổi nhạc hội, các buổi lễ, các cuộc thi...",
            "Liên tục báo cáo tiến độ cho Core Project nắm rõ tình hình. Chủ động phối hợp và liên kết với các team khác của dự án. Lập các group làm việc chung giữa Team Event và các team khác để thảo luận như Team Media, Team ER, Team MLC..."
          ]} />

          <Box sx={{ background: '#1a1a1a', border: '1px solid #4ECDC4', borderRadius: 1.5, p: 2.5, mt: 3 }}>
            <Typography variant="body2" sx={{ color: '#4ECDC4', fontWeight: 500, mb: 1.5 }}>
              📋 Checklist các đồ dùng cần thiết
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', lineHeight: 1.7, mb: 2 }}>
              Checklist vô cùng quan trọng vì nó giúp đảm bảo kiểm soát đầy đủ đồ dùng cần thiết để tổ chức sự kiện, luôn cập nhật Checklist (lưu ý: chính xác giá tiền gốc - không áp khuyến mãi, thời gian đặt - nhận,...).
            </Typography>

            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
              Checklist Tổng
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', lineHeight: 1.7, mb: 1.5, pl: 2 }}>
              Giúp nắm được ngày hôm đó sẽ cần gì hay khu vực đó cần gì. Checklist Tổng có 2 dạng:
            </Typography>
            <Box component="ul" sx={{ color: '#999', pl: 4, mb: 2 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Checklist Tổng theo ngày</strong> (dùng cho các dự án diễn ra nhiều ngày, như các cuộc thi nhiều vòng...). Ví dụ: Checklist Vòng Casting, Checklist Vòng Bán kết, Checklist Vòng Chung kết...
              </li>
              <li>
                <strong>Checklist Tổng theo khu vực</strong> (dùng cho các dự án diễn ra một ngày). Ví dụ: Checklist Khu vực Hội trường, Checklist Khu vực Backstage, Checklist Khu vực Sảnh chờ...
              </li>
            </Box>

            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
              Checklist Hạng mục (Checklist Nhà Cung cấp)
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', lineHeight: 1.7, mb: 1.5, pl: 2 }}>
              Giúp nắm được có bao nhiêu NCC, những món đồ sẽ đặt của NCC đó. Checklist Hạng mục thường dùng như:
            </Typography>
            <Box component="ul" sx={{ color: '#999', pl: 4, mb: 1.5 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Checklist Mượn đồ</strong> (mượn từ trường hoặc kho ED). Chú ý mượn trường sớm (nhất là mượn sảnh, hội trường...), nên mượn trước khoảng 1 tháng. Mượn kho ED thì liên hệ với Thủ kho (Lê Quốc Khánh), cần liên hệ sớm để sắp xếp thời gian (khoảng 1 tuần).
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>Checklist Văn phòng phẩm.</strong> Chú ý Checklist Văn phòng phẩm bắt buộc phải ưu tiên chọn NCC mà FPTU yêu cầu: Văn phòng phẩm Bến Thành.
              </li>
              <li style={{ marginBottom: '0.5rem' }}>Checklist In ấn & Thi công.</li>
              <li style={{ marginBottom: '0.5rem' }}>Checklist Kỹ thuật.</li>
              <li style={{ marginBottom: '0.5rem' }}>Checklist Quà.</li>
              <li style={{ marginBottom: '0.5rem' }}>Checklist Decor.</li>
              <li>Checklist Khác (những món còn lại không thể phân loại).</li>
            </Box>
          </Box>

          <Box sx={{ background: '#1a1a1a', border: '1px solid #FFD700', borderRadius: 1.5, p: 2.5, mt: 3 }}>
            <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 500, mb: 1.5 }}>
              💰 Hướng dẫn Scout giá vật dụng
            </Typography>
            <Box component="ul" sx={{ color: '#999', pl: 3 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                Theo hướng dẫn mẫu có trong sheet Paperwork Talk (Sheet này hướng dẫn các bước nhắn tin và các thông tin cần đảm bảo khi scout vật dụng).
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Đặc biệt, đối với Checklist VPP:</strong>
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    Gửi Checklist VPP cần đặt cho anh/ chị cán bộ IC-PDP đảm nhận (anh Bảo Bảo). Nhờ anh/ chị cán bộ đặt giúp. Nên gửi sớm, trễ nhất là 1 tuần trước khi onsite.
                  </li>
                  <li>
                    Những món đồ NCC Bến Thành không có, họ sẽ báo về cho anh/ chị cán bộ IC - PDP. Team Event sẽ được mua từ các NCC khác nhưng vẫn phải đảm bảo các yếu tố giấy tờ và giá cả (Fahasa...).
                  </li>
                </ul>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                Lưu ý: tìm NCC phải đủ tiêu chuẩn PPW cần, mua hàng không vượt kinh phí Plan đề ra, chỉ thanh toán thông qua chuyển khoản.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                Có thể dùng tìm lại các NCC đã từng hợp tác thông qua Sheet Vendors.
              </li>
              <li>
                Với những dự án/ sự kiện có kinh phí không cao, có thể liên hệ Thủ Kho (Lê Quốc Khánh) để xin Sheet Đồ Sự kiện, xem xét tận dụng các đồ CSG vẫn còn.
              </li>
            </Box>
          </Box>
        </Box>
      </SectionAccordion>

      {/* B. GIAI ĐOẠN PRE-PRODUCTION */}
      <Typography
        variant="caption"
        sx={{ color: '#666', mb: 2, mt: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}
      >
        B. Giai đoạn Pre-Production
      </Typography>

      {/* Event Production Pre-prod */}
      <SectionAccordion id="event-preprod" title="Event Production - Hoạt động" color="#4ECDC4" expanded={expanded} handleChange={handleChange}>
        <ActivityList activities={[
          "Hoàn thiện các công việc ở phase trước",
          "Core Event ước lượng số lượng nhân sự và cơ cấu vai trò nhân sự (ví dụ ngày onsite có bao nhiêu nhân sự kỹ thuật, bao nhiêu nhân sự điều phối, bao nhiêu nhân sự check-in...)",
          "Viết content tuyển Event Members. Chốt ngày đăng tuyển nhân sự. Core Event gửi content tuyển Event Members vào Group Event Leader"
        ]} />
      </SectionAccordion>

      {/* Team Paperwork */}
      <SectionAccordion id="paperwork" title="Team Paperwork" color="#9B59B6" expanded={expanded} handleChange={handleChange}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', lineHeight: 1.7, mb: 3, pl: 2, borderLeft: '2px solid #2a2a2a' }}>
            Team PaperWork đóng vai trò then chốt trong việc đảm bảo sự minh bạch và trôi chảy của dòng tiền trong dự án. Không chỉ quản lý tài chính, theo dõi ngân sách một cách chặt chẽ mà còn chịu trách nhiệm thực hiện các thủ tục giấy tờ cần thiết để đảm bảo các khoản thanh toán được xử lý đúng hạn. Với sự chính xác và trách nhiệm, team PaperWork góp phần duy trì sự ổn định tài chính, hỗ trợ dự án vận hành suôn sẻ và hiệu quả.
          </Typography>

          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Vị trí
          </Typography>

          <PositionCard
            title="PaperWork Leader"
            quantity="1 thành viên"
            duties="PaperWork Leader là người giữ vai trò trọng yếu trong việc quản lý và điều phối dòng tiền của dự án. Họ chịu trách nhiệm chính trong việc nhận và quản lý các khoản ứng tiền từ quỹ và trường, tiếp nhận tài trợ từ team ER, đồng thời phê duyệt các khoản chi trong dự án. Có quyền từ chối các khoản chi ngoài kế hoạch hoặc vượt ngân sách đã đề ra mà không có sự thông báo trước. Với nhiệm vụ đảm bảo dòng tiền luôn cân đối, minh bạch, không bị âm. PaperWork Leader giám sát chặt chẽ các giao dịch tài chính và xử lý giấy tờ liên quan, đảm bảo mọi thủ tục được hoàn tất đúng hạn trên hệ thống. Sự chính xác và trách nhiệm của họ giúp dự án vận hành ổn định và minh bạch."
          />

          <PositionCard
            title="PaperWork Sub-Leader"
            quantity="1-2 thành viên (tùy vào quy mô dự án sẽ có hay không có Sub-Leader)"
            duties="PaperWork Sub-Leader là cánh tay phải đắc lực của PaperWork Leader, chịu trách nhiệm hỗ trợ theo dõi và đảm bảo tiến độ xử lý giấy tờ của các thành viên trong team. Họ giám sát, nhắc nhở và đảm bảo mọi thủ tục được hoàn thành đúng hạn, đồng thời sẵn sàng thay mặt Leader giải quyết công việc khi cần thiết. Với vai trò linh hoạt và trách nhiệm cao, PaperWork Sub-Leader giúp duy trì sự mạch lạc và hiệu quả trong quản lý tài chính và giấy tờ của dự án."
          />

          <PositionCard
            title="PaperWork Members"
            quantity="Trung bình 4-5 thành viên, số lượng tùy thuộc vào quy mô của dự án"
            duties="PaperWork Members đóng vai trò hỗ trợ quan trọng trong việc đảm bảo các thủ tục tài chính và giấy tờ của dự án diễn ra suôn sẻ. Họ thực hiện các giấy tờ theo sự phân công của PaperWork Leader trong mastersheet của team, đồng thời theo dõi tiến độ và thu thập thông tin từ các nhà cung cấp của dự án. Với sự tỉ mỉ và trách nhiệm, PaperWork Members góp phần duy trì sự chính xác, minh bạch và hiệu quả trong công tác quản lý tài chính của dự án."
          />

          <Box sx={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 1.5, p: 2, mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#666' }}>Thời gian hoạt động</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              Từ khi plan được ký đến <span style={{ color: '#FFD700' }}>1 tháng sau onsite</span>
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Hoạt động
          </Typography>
          <ActivityList activities={[
            "Lập group và giới thiệu",
            "Leader lập matersheet PPW. Bao gồm việc Phân chia task cho các thành viên theo Nhà cung cấp",
            "Họp kickoff team, BẮT BUỘC có sự tham gia của Core Project (Project Leader, Subleader) và Core Event (Event Leader, Subleader)",
            "Nội dung cuộc họp: giải thích các thắc mắc của members, confirm với team Event về các khoản cần ứng, theo 2 giai đoạn chính (trước onsite và sau onsite)",
            "Gửi mail ứng tiền cho dự án: quy định (trước 1 tuần/ 7 ngày khi đi mua đồ cho dự án) và template email ứng tiền",
            "Được add vào group với các NCC theo task đã được chia trước đó",
            "Xin các thông tin cần thiết để làm giấy tờ"
          ]} />
        </Box>
      </SectionAccordion>

      {/* C. GIAI ĐOẠN PRODUCTION */}
      <Typography
        variant="caption"
        sx={{ color: '#666', mb: 2, mt: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}
      >
        C. Giai đoạn Production
      </Typography>

      {/* Event Production */}
      <SectionAccordion id="event-prod" title="Event Production - Hoạt động" color="#4ECDC4" expanded={expanded} handleChange={handleChange}>
        <ActivityList activities={[
          "Hoàn thiện các công việc ở các giai đoạn trước",
          "Đăng tuyển Event Members. Sau đó, lập Group [CSG] Tên dự án - Event Members (bao gồm Project Leader, Project Sub-Leader(s), Project Mentor(s), Event Leader, Event Sub-Leader(s), Event Mentor(s), Event members, Chủ nhiệm, Trưởng Ban Event, Phó Ban Event, Event Production Leader). Nhập thông tin đầy đủ vào Danh sách nhân sự",
          "Core Event phải kết nối được với tất cả Event Members, quan sát và hỗ trợ các bạn. Core Event có thể cân nhắc tính chất sự kiện để chủ động việc cho các bạn thành viên đăng ký slot hoạt động",
          "Tạo các group [CSG] Tên dự án - Event x Tên NCC có đủ Core Event, NCC và Paperwork Leader vào group. PPW Leader sẽ tự thêm thành viên của team mình vào sau",
          "Xác nhận đặt hàng rõ ràng với các NCC về số lượng, số tiền, số tiền cọc trước, thời gian giao-nhận-trả hàng. Phối hợp chặt chẽ với Team Paperwork",
          "Nhận hàng và bàn giao giấy tờ về Team Paperwork",
          "Họp Event Members để giao lưu tăng tinh thần, giới thiệu dự án, sự kiện, phổ biến nhiệm vụ, training công việc",
          "Theo dõi và quản lý ngày Setup, Rehearsal và Onsite. Thật may mắn, thật bình tĩnh, thật tử tế",
          "Kêu gọi tiệc sau Onsite, cố gắng đầy đủ Event Members để chia sẻ với các bạn. Ngoài ra, còn gửi vào Group Event Production (dù không phải Event Members của dự án nhưng vẫn là gia đình, vẫn tham gia chung vui cùng mọi người)",
          "Core Event cùng Core Project họp feedback và chấm điểm thành viên sau dự án"
        ]} />
      </SectionAccordion>

      {/* Paperwork Production */}
      <SectionAccordion id="ppw-prod" title="Paperwork - Hoạt động" color="#9B59B6" expanded={expanded} handleChange={handleChange}>
        <ActivityList activities={[
          "Sau khi team Event xác nhận đặt hàng, gửi các file giấy tờ cần thiết cho NCC và nhắc nhở giao chung khi giao hàng",
          "Tiến hành hoàn thiện các giấy tờ theo yêu cầu của Leader PaperWork",
          "Thanh toán các khoản tiền cọc cho các nhà cung cấp (các nhà cung cấp yêu cọc tiền trước)",
          "Nộp giấy tờ đầy đủ cán bộ thanh toán của trường",
          "Hoàn ứng tiền cho các thành viên (nếu có)",
          "Kiểm tra các NCC đã nhận tiền từ trường chưa",
          "Kiểm tra các nghệ sĩ, nghệ nhân đã nhận tiền từ trường chưa (nếu có)",
          "Hoàn tiền ứng quỹ cho team quỹ của CLB"
        ]} />
      </SectionAccordion>

      {/* Kích thước ấn phẩm */}
      <Box
        sx={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 2,
          p: 3,
          mt: 4
        }}
      >
        <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 500, mb: 2 }}>
          Kích thước các khu ấn phẩm event
        </Typography>
        <Box component="ul" sx={{ color: '#999', pl: 3, m: 0 }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#fff' }}>Banner Led Trống đồng:</strong> 2640 x 400 px, RGB, 96ppi
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#fff' }}>Standee thường:</strong> 80 x 180, 50 ppi
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#fff' }}>Standee Led:</strong> 1080 x 1920 px, RGB, 96 ppi
          </li>
          <li>
            <strong style={{ color: '#fff' }}>Backdrop:</strong> các kích cỡ thường dùng: 4.5 x 2.5m; 3 x 5m hoặc Core Event tự triển khai kích thước theo layout thực tế
          </li>
        </Box>
      </Box>

      {/* Note */}
      <Box
        sx={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderLeft: '3px solid #f59e0b',
          borderRadius: 2,
          p: 2.5,
          mt: 3
        }}
      >
        <Typography variant="body2" sx={{ color: '#999', lineHeight: 1.7 }}>
          <strong style={{ color: '#f59e0b' }}>Lưu ý:</strong> Tất cả đều phải cân nhắc vào tình hình thực tế. Guide này để tham khảo, cần linh hoạt trong quá trình áp dụng.
        </Typography>
      </Box>

      {/* Scroll to top */}
      <Box
        onClick={scrollToTop}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 40,
          height: 40,
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease',
          '&:hover': {
            borderColor: '#FFD700'
          }
        }}
      >
        <KeyboardArrowUpIcon sx={{ color: '#666' }} />
      </Box>
    </Box>
  );
};

export default EventGuidePage;
