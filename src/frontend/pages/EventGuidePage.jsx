// EventGuidePage - Trang hiển thị Event Department Guide
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const EventGuidePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState('planning-team');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Component cho Position Card
  const PositionCard = ({ title, quantity, duties, requirements }) => (
    <Box
      sx={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 1.5,
        p: 2.5,
        mb: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: '#666' }}>
          {quantity}
        </Typography>
      </Box>
      {duties && (
        <Box sx={{ mb: requirements ? 1.5 : 0 }}>
          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Nhiệm vụ
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', mt: 0.5, lineHeight: 1.6 }}>
            {duties}
          </Typography>
        </Box>
      )}
      {requirements && (
        <Box>
          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Yêu cầu
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
            {requirements}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Component cho Activity List
  const ActivityList = ({ activities }) => (
    <Box component="ol" sx={{ p: 0, m: 0, listStyle: 'none' }}>
      {activities.map((activity, idx) => (
        <Box 
          component="li" 
          key={idx} 
          sx={{ 
            display: 'flex', 
            alignItems: 'flex-start',
            py: 0.75
          }}
        >
          <Box 
            sx={{ 
              color: '#666', 
              mr: 1.5, 
              minWidth: 28, 
              textAlign: 'right',
              flexShrink: 0,
              fontSize: '0.9rem',
              lineHeight: 1.6
            }}
          >
            {idx + 1}.
          </Box>
          <Box
            sx={{ color: '#999', fontSize: '0.9rem', lineHeight: 1.6 }}
          >
            {activity}
          </Box>
        </Box>
      ))}
    </Box>
  );

  const SectionAccordion = ({ id, title, color, children }) => (
    <Accordion
      expanded={expanded === id}
      onChange={handleChange(id)}
      sx={{
        background: '#121212',
        border: '1px solid #2a2a2a',
        borderRadius: '8px !important',
        mb: 1.5,
        '&:before': { display: 'none' },
        '&.Mui-expanded': {
          borderColor: color
        }
      }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon sx={{ color: '#666' }} />}
        sx={{ py: 0.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 3, height: 20, background: color, borderRadius: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 500, color: '#fff' }}>
            {title}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 3 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );

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
          Cẩm nang được xây dựng như một khung hướng dẫn vận hành chuẩn hóa, nhằm nâng cao tính hiệu quả và chuyên nghiệp trong tổ chức các sự kiện của Cóc Sài Gòn.
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
      <SectionAccordion id="planning-team" title="Team Planning" color="#FF6B6B">
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', lineHeight: 1.7, mb: 3, pl: 2, borderLeft: '2px solid #2a2a2a' }}>
            Planning hướng tới việc kiến tạo những kế hoạch táo bạo, nơi các thành viên được thỏa sức bùng nổ ý tưởng và biến những khát vọng táo bạo thành hiện thực.
          </Typography>
          
          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Vị trí
          </Typography>
          
          <PositionCard
            title="Planning Leader"
            quantity="1 người"
            duties="Định hướng, quản lý và kết nối các khâu tổ chức. Lên ý tưởng, xây dựng kế hoạch chi tiết, xác định mục tiêu và nội dung."
          />

          <PositionCard
            title="Planning Members"
            quantity="4-5 người"
            duties="Hỗ trợ brainstorm, đề xuất ý tưởng sáng tạo, scout giá các hạng mục trong bảng kế hoạch."
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
            "Kickoff offline: trình bày Peer Review + thông tin cơ bản dự án",
            "Brainstorm concept + các hoạt động trong dự án",
            "Brainstorm tên cho sự kiện và hoạt động",
            "Chốt Concept + Hoạt động + Tên dự án",
            "Scout giá các hạng mục trong bản kế hoạch"
          ]} />
        </Box>
      </SectionAccordion>

      {/* Team Event Production (Planning) */}
      <SectionAccordion id="event-production-planning" title="Team Event Production" color="#4ECDC4">
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Vị trí
          </Typography>
          
          <PositionCard
            title="Event Leader"
            quantity="1 người"
            duties="Kết nối Core Event với các team khác, vạch ra công việc, quản lý team và tiến độ."
            requirements="Chú tâm, chủ động, nghiêm túc"
          />

          <PositionCard
            title="Event Sub-Leader"
            quantity="1-2 người"
            duties="Hỗ trợ Leader, quản lý tiến độ công việc của Event."
          />

          <PositionCard
            title="Event Members"
            quantity="10-20+ người"
            duties="Thực hiện công việc Core Event giao phó, hỗ trợ hết mình cho dự án."
          />

          <PositionCard
            title="Event Mentor"
            quantity="1-2 người"
            duties="Hướng dẫn và hỗ trợ Event Leader làm việc, cung cấp tài liệu tham khảo."
          />

          <Box sx={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 1.5, p: 2, mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#666' }}>Thời gian hoạt động</Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
              Core Event: <span style={{ color: '#FFD700' }}>2 tuần</span> sau Team Planning
            </Typography>
            <Typography variant="body2" sx={{ color: '#999' }}>
              Event Members: <span style={{ color: '#FFD700' }}>1 - 1.5 tuần</span> trước sự kiện
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Hoạt động
          </Typography>
          <ActivityList activities={[
            "Lập group Core Event",
            "Lập Event Folder và Event Master Sheet",
            "Tổ chức kick-off meeting",
            "Phân công nhiệm vụ trong Event Master Sheet",
            "Tham gia Team Planning để nắm thông tin dự án",
            "Lên Timeline tổng quan toàn sự kiện",
            "Lập Checklist đồ dùng cần thiết",
            "Scout giá vật dụng theo Checklist",
            "Tạo Form Đăng ký và Feedback",
            "Lên Quy trình, Agenda, Kịch bản Master"
          ]} />
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
      <SectionAccordion id="event-preprod" title="Event Production - Hoạt động" color="#4ECDC4">
        <ActivityList activities={[
          "Hoàn thiện các công việc ở giai đoạn trước",
          "Ước lượng số lượng và cơ cấu vai trò nhân sự",
          "Viết content tuyển Event Members",
          "Chốt ngày đăng tuyển nhân sự"
        ]} />
      </SectionAccordion>

      {/* Team Paperwork */}
      <SectionAccordion id="paperwork" title="Team Paperwork" color="#9B59B6">
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', lineHeight: 1.7, mb: 3, pl: 2, borderLeft: '2px solid #2a2a2a' }}>
            Team Paperwork đảm bảo sự minh bạch và trôi chảy của dòng tiền trong dự án, quản lý tài chính và thực hiện các thủ tục giấy tờ.
          </Typography>

          <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Vị trí
          </Typography>
          
          <PositionCard
            title="PaperWork Leader"
            quantity="1 người"
            duties="Quản lý và điều phối dòng tiền dự án. Nhận và quản lý các khoản ứng tiền, phê duyệt các khoản chi."
          />

          <PositionCard
            title="PaperWork Sub-Leader"
            quantity="1-2 người"
            duties="Hỗ trợ theo dõi và đảm bảo tiến độ xử lý giấy tờ của các thành viên."
          />

          <PositionCard
            title="PaperWork Members"
            quantity="4-5 người"
            duties="Thực hiện các giấy tờ theo sự phân công của Leader trong mastersheet."
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
            "Leader lập mastersheet PPW, phân chia task",
            "Họp kickoff với Core Project và Core Event",
            "Gửi mail ứng tiền (trước 7 ngày khi mua đồ)",
            "Add vào group với các NCC theo task",
            "Xin thông tin cần thiết để làm giấy tờ"
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
      <SectionAccordion id="event-prod" title="Event Production - Hoạt động" color="#4ECDC4">
        <ActivityList activities={[
          "Hoàn thiện các công việc giai đoạn trước",
          "Đăng tuyển Event Members, lập Group",
          "Kết nối và hỗ trợ Event Members",
          "Tạo group với các NCC",
          "Xác nhận đặt hàng với NCC",
          "Nhận hàng và bàn giao giấy tờ cho Paperwork",
          "Họp Event Members: giới thiệu, phổ biến nhiệm vụ",
          "Quản lý ngày Setup, Rehearsal và Onsite",
          "Tổ chức tiệc sau Onsite",
          "Họp feedback và chấm điểm thành viên"
        ]} />
      </SectionAccordion>

      {/* Paperwork Production */}
      <SectionAccordion id="ppw-prod" title="Paperwork - Hoạt động" color="#9B59B6">
        <ActivityList activities={[
          "Gửi file giấy tờ cho NCC",
          "Hoàn thiện giấy tờ theo yêu cầu",
          "Thanh toán tiền cọc cho NCC",
          "Nộp giấy tờ cho cán bộ thanh toán",
          "Hoàn ứng tiền cho thành viên",
          "Kiểm tra NCC đã nhận tiền từ trường",
          "Hoàn tiền ứng quỹ cho CLB"
        ]} />
      </SectionAccordion>

      {/* Note */}
      <Box
        sx={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderLeft: '3px solid #f59e0b',
          borderRadius: 1.5,
          p: 2.5,
          mt: 4
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
          borderRadius: 1,
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
