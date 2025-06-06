// 简化版学习复盘系统
console.log('Script loading...');

// 全局变量
let app = null;

// 简单的数据存储
let studyData = {
    user: {
        level: 1,
        exp: 0,
        points: 0,
        streakDays: 0
    },
    grades: [],
    papers: [],
    achievements: []
};

// 初始化函数
function initApp() {
    console.log('Initializing app...');
    
    // 加载数据
    const saved = localStorage.getItem('studyTrackerData');
    if (saved) {
        studyData = { ...studyData, ...JSON.parse(saved) };
    }
    
    // 更新UI
    updateUI();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化成绩页面
    renderGrades();
    
    // 初始化试卷页面
    renderPapers();
    
    console.log('App initialized successfully');
}

// 更新UI
function updateUI() {
    // 更新等级信息
    const levelInfo = getLevelInfo(studyData.user.level);
    document.getElementById('userLevel').textContent = `Lv.${studyData.user.level} ${levelInfo.title}`;
    
    // 更新经验条
    const expPercent = (studyData.user.exp / levelInfo.expRequired) * 100;
    document.getElementById('expFill').style.width = `${expPercent}%`;
    document.getElementById('expText').textContent = `${studyData.user.exp}/${levelInfo.expRequired} EXP`;
    
    // 更新积分和连续天数
    document.getElementById('totalPoints').textContent = studyData.user.points;
    document.getElementById('shopPoints').textContent = studyData.user.points;
    document.getElementById('streakDays').textContent = studyData.user.streakDays;
    
    // 更新统计数据
    updateStats();
}

// 获取等级信息
function getLevelInfo(level) {
    const levels = [
        { level: 1, title: '学习者', expRequired: 100 },
        { level: 2, title: '勤奋生', expRequired: 200 },
        { level: 3, title: '优等生', expRequired: 400 },
        { level: 4, title: '学习达人', expRequired: 800 },
        { level: 5, title: '学霸', expRequired: 1600 },
        { level: 6, title: '学神', expRequired: 3200 }
    ];
    
    return levels.find(l => l.level === level) || levels[levels.length - 1];
}

// 更新统计数据
function updateStats() {
    const subjects = [...new Set(studyData.grades.map(g => g.subject))];
    const avgScore = studyData.grades.length > 0 
        ? Math.round(studyData.grades.reduce((sum, g) => sum + (g.score / g.fullScore * 100), 0) / studyData.grades.length)
        : 0;

    document.getElementById('totalSubjects').textContent = subjects.length;
    document.getElementById('avgScore').textContent = avgScore;
    document.getElementById('studyDays').textContent = studyData.user.streakDays;
    document.getElementById('totalPapers').textContent = studyData.papers.length;
}

// 设置事件监听器
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // 导航切换
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchTab(tab);
        });
    });
    
    // 成绩表单
    const gradeForm = document.getElementById('gradeForm');
    if (gradeForm) {
        gradeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addGrade();
        });
    }
    
    // 试卷表单
    const paperForm = document.getElementById('paperForm');
    if (paperForm) {
        paperForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addPaper();
        });
    }
}

// 切换标签页
function switchTab(tab) {
    console.log('Switching to tab:', tab);
    
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // 更新内容区域
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tab).classList.add('active');
    
    // 根据标签页调用相应的渲染函数
    if (tab === 'grades') {
        renderGrades();
    } else if (tab === 'papers') {
        renderPapers();
    }
}

// 显示模态框
function showAddGradeModal() {
    console.log('Showing add grade modal...');
    const modal = document.getElementById('addGradeModal');
    if (modal) {
        modal.style.display = 'block';
        // 设置默认日期
        const examDate = document.getElementById('examDate');
        if (examDate) {
            examDate.value = new Date().toISOString().split('T')[0];
        }
    } else {
        console.error('Modal not found!');
    }
}

// 关闭模态框
function closeModal(modalId) {
    console.log('Closing modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 添加成绩
function addGrade() {
    console.log('Adding grade...');
    
    const formData = {
        subject: document.getElementById('subject').value,
        score: parseInt(document.getElementById('score').value),
        fullScore: parseInt(document.getElementById('fullScore').value),
        examDate: document.getElementById('examDate').value,
        examType: document.getElementById('examType').value,
        notes: document.getElementById('notes').value,
        id: Date.now()
    };
    
    studyData.grades.push(formData);
    
    // 奖励经验和积分
    addExp(20);
    addPoints(10);
    
    // 保存数据
    saveData();
    
    // 更新UI
    updateUI();
    
    // 渲染成绩页面
    renderGrades();
    
    // 关闭模态框
    closeModal('addGradeModal');
    
    // 重置表单
    document.getElementById('gradeForm').reset();
    
    alert('成绩添加成功！获得 20 EXP 和 10 积分！');
}

// 添加经验值
function addExp(amount) {
    studyData.user.exp += amount;
    
    // 检查升级
    const currentLevel = studyData.user.level;
    const levelInfo = getLevelInfo(currentLevel);
    
    if (studyData.user.exp >= levelInfo.expRequired && currentLevel < 6) {
        studyData.user.level++;
        studyData.user.exp = 0;
        const newLevelInfo = getLevelInfo(studyData.user.level);
        alert(`🎉 恭喜升级！你现在是 Lv.${studyData.user.level} ${newLevelInfo.title}！`);
    }
}

// 添加积分
function addPoints(amount) {
    studyData.user.points += amount;
}

// 保存数据
function saveData() {
    localStorage.setItem('studyTrackerData', JSON.stringify(studyData));
}

// 开始学习会话
function startStudySession() {
    studyData.user.streakDays++;
    addExp(10);
    addPoints(5);
    saveData();
    updateUI();
    alert('开始学习会话！获得 10 EXP 和 5 积分！');
}

// 显示试卷模态框
function showAddPaperModal() {
    console.log('Showing add paper modal...');
    const modal = document.getElementById('addPaperModal');
    if (modal) {
        modal.style.display = 'block';
        const paperDate = document.getElementById('paperDate');
        if (paperDate) {
            paperDate.value = new Date().toISOString().split('T')[0];
        }
    }
}

// 添加试卷
function addPaper() {
    console.log('Adding paper...');
    
    const formData = {
        subject: document.getElementById('paperSubject').value,
        title: document.getElementById('paperTitle').value,
        type: document.getElementById('paperType').value,
        date: document.getElementById('paperDate').value,
        score: parseInt(document.getElementById('paperScore').value) || 0,
        fullScore: parseInt(document.getElementById('paperFullScore').value) || 100,
        notes: document.getElementById('paperNotes').value,
        id: Date.now()
    };
    
    studyData.papers.push(formData);
    
    // 奖励经验和积分
    addExp(15);
    addPoints(8);
    
    // 保存数据
    saveData();
    
    // 更新UI
    updateUI();
    
    // 渲染试卷页面
    renderPapers();
    
    // 关闭模态框
    closeModal('addPaperModal');
    
    // 重置表单
    document.getElementById('paperForm').reset();
    
    alert('试卷添加成功！获得 15 EXP 和 8 积分！');
}

// 学习方法函数
function startPomodoro() {
    alert('番茄工作法：25分钟专注学习 + 5分钟休息。开始你的专注时间吧！');
    addExp(25);
    addPoints(15);
    saveData();
    updateUI();
}

function showFeynmanGuide() {
    alert(`费曼学习法四步骤：
1. 选择一个概念
2. 用简单的话解释给别人听
3. 发现不懂的地方，回去学习
4. 简化和类比，直到能清楚解释

这个方法能帮你真正理解知识！`);
}

function createReviewPlan() {
    alert(`间隔重复复习计划：
第1天：学习新内容
第2天：第一次复习
第4天：第二次复习
第7天：第三次复习
第15天：第四次复习
第30天：第五次复习

按照这个计划复习，记忆效果最佳！`);
}

function setSmartGoal() {
    const goal = prompt(`设定你的SMART学习目标：

S - 具体的 (Specific)
M - 可衡量的 (Measurable)  
A - 可达成的 (Achievable)
R - 相关的 (Relevant)
T - 有时限的 (Time-bound)

例如：在下次月考中，数学成绩提高到85分以上`);
    
    if (goal) {
        alert('目标设定成功！记得定期检查进度哦！');
        addExp(15);
        addPoints(10);
        saveData();
        updateUI();
    }
}

function createMindMap() {
    alert(`思维导图创建步骤：
1. 在中心写下主题
2. 从中心向外画分支
3. 每个分支写一个关键词
4. 继续细分子分支
5. 使用颜色和图像

推荐工具：XMind、MindMaster、百度脑图`);
}

function openMistakeBook() {
    alert('错题本功能开发中...敬请期待！');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initApp();
});

// 渲染成绩页面
function renderGrades() {
    console.log('renderGrades called');
    const subjectsGrid = document.getElementById('subjectsGrid');
    console.log('subjectsGrid:', subjectsGrid);
    if (!subjectsGrid) return;
    
    // 清空现有内容
    subjectsGrid.innerHTML = '';
    
    // 获取所有科目
    console.log('studyData.grades:', studyData.grades);
    const subjects = [...new Set(studyData.grades.map(grade => grade.subject))];
    console.log('subjects:', subjects);
    
    if (subjects.length === 0) {
        subjectsGrid.innerHTML = '<p class="no-data">暂无成绩数据，点击"添加成绩"开始记录吧！</p>';
        return;
    }
    
    subjects.forEach(subject => {
        const subjectGrades = studyData.grades.filter(grade => grade.subject === subject);
        const avgScore = subjectGrades.reduce((sum, grade) => sum + grade.score, 0) / subjectGrades.length;
        const latestGrade = subjectGrades[subjectGrades.length - 1];
        
        const subjectCard = document.createElement('div');
        subjectCard.className = 'subject-card';
        subjectCard.innerHTML = `
            <div class="subject-header">
                <h3>${subject}</h3>
                <span class="subject-score">${avgScore.toFixed(1)}</span>
            </div>
            <div class="subject-info">
                <p>最近成绩: ${latestGrade.score}/${latestGrade.fullScore}</p>
                <p>考试类型: ${latestGrade.examType}</p>
                <p>考试日期: ${latestGrade.examDate}</p>
            </div>
        `;
        
        subjectCard.addEventListener('click', () => showSubjectDetail(subject));
        subjectsGrid.appendChild(subjectCard);
    });
}

// 显示科目详情
function showSubjectDetail(subject) {
    const subjectGrades = studyData.grades.filter(grade => grade.subject === subject);
    const detailArea = document.getElementById('gradeDetails');
    if (!detailArea) return;
    
    detailArea.innerHTML = `
        <h3>${subject} 成绩详情</h3>
        <div class="grade-list">
            ${subjectGrades.map(grade => `
                <div class="grade-item">
                    <div class="grade-score">${grade.score}/${grade.maxScore}</div>
                    <div class="grade-info">
                        <p><strong>${grade.examType}</strong></p>
                        <p>${grade.date}</p>
                        ${grade.notes ? `<p class="grade-notes">${grade.notes}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 渲染试卷页面
function renderPapers() {
    console.log('Rendering papers...');
    const papersGrid = document.getElementById('papersGrid');
    if (!papersGrid) {
        console.log('Papers grid not found');
        return;
    }
    
    // 清空现有内容
    papersGrid.innerHTML = '';
    
    console.log('studyData.papers:', studyData.papers);
    
    if (studyData.papers.length === 0) {
        papersGrid.innerHTML = '<p class="no-data">暂无试卷数据，点击"添加试卷"开始记录吧！</p>';
        return;
    }
    
    studyData.papers.forEach(paper => {
        const paperCard = document.createElement('div');
        paperCard.className = 'paper-card';
        paperCard.innerHTML = `
            <div class="paper-header">
                <h3>${paper.title}</h3>
                <span class="paper-score">${paper.score}/${paper.fullScore}</span>
            </div>
            <div class="paper-info">
                <p><strong>科目:</strong> ${paper.subject}</p>
                <p><strong>类型:</strong> ${paper.type}</p>
                <p><strong>日期:</strong> ${paper.date}</p>
                ${paper.notes ? `<p><strong>备注:</strong> ${paper.notes}</p>` : ''}
            </div>
        `;
        
        paperCard.addEventListener('click', () => showPaperDetail(paper));
        papersGrid.appendChild(paperCard);
    });
}

// 显示试卷详情
function showPaperDetail(paper) {
    const detailArea = document.getElementById('paperDetails');
    if (!detailArea) return;
    
    detailArea.innerHTML = `
        <div class="paper-detail">
            <h3>${paper.title}</h3>
            <div class="detail-info">
                <p><strong>科目:</strong> ${paper.subject}</p>
                <p><strong>类型:</strong> ${paper.type}</p>
                <p><strong>日期:</strong> ${paper.date}</p>
                <p><strong>得分:</strong> ${paper.score}/${paper.fullScore} (${((paper.score/paper.fullScore)*100).toFixed(1)}%)</p>
                ${paper.notes ? `<div class="notes-section"><strong>备注/错题记录:</strong><br>${paper.notes}</div>` : ''}
            </div>
        </div>
    `;
}

console.log('Script loaded successfully');