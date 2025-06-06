// 学习复盘系统主类
class StudyTracker {
    constructor() {
        this.data = this.loadData();
        this.currentTab = 'dashboard';
        this.gradeChart = null;
        this.pomodoroTimer = null;
        this.pomodoroState = {
            isRunning: false,
            timeLeft: 25 * 60, // 25分钟
            isBreak: false
        };
        
        this.init();
    }

    // 初始化应用
    init() {
        this.setupEventListeners();
        this.updateUI();
        this.updateStats();
        this.renderDashboard();
        this.checkAchievements();
        this.updateDailyStreak();
    }

    // 加载数据
    loadData() {
        const defaultData = {
            user: {
                level: 1,
                exp: 0,
                points: 0,
                streakDays: 0,
                lastActiveDate: null
            },
            grades: [],
            papers: [],
            achievements: [],
            studyMethods: {
                pomodoroSessions: 0,
                studyDays: 0
            },
            shop: {
                purchased: []
            }
        };

        const saved = localStorage.getItem('studyTrackerData');
        return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    }

    // 保存数据
    saveData() {
        localStorage.setItem('studyTrackerData', JSON.stringify(this.data));
    }

    // 设置事件监听器
    setupEventListeners() {
        // 导航切换
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 表单提交
        document.getElementById('gradeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGrade();
        });

        document.getElementById('paperForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPaper();
        });

        // 番茄钟控制
        document.getElementById('startTimer').addEventListener('click', () => this.startPomodoro());
        document.getElementById('pauseTimer').addEventListener('click', () => this.pausePomodoro());
        document.getElementById('resetTimer').addEventListener('click', () => this.resetPomodoro());

        // 模态框关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    // 切换标签页
    switchTab(tab) {
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

        this.currentTab = tab;

        // 根据标签页渲染内容
        switch(tab) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'grades':
                this.renderGrades();
                break;
            case 'study-methods':
                this.renderStudyMethods();
                break;
            case 'papers':
                this.renderPapers();
                break;
            case 'achievements':
                this.renderAchievements();
                break;
            case 'shop':
                this.renderShop();
                break;
        }
    }

    // 更新用户界面
    updateUI() {
        const user = this.data.user;
        
        // 更新等级和经验
        const levelInfo = this.getLevelInfo(user.level);
        document.getElementById('userLevel').textContent = `Lv.${user.level} ${levelInfo.title}`;
        
        const expPercent = (user.exp / levelInfo.expRequired) * 100;
        document.getElementById('expFill').style.width = `${expPercent}%`;
        document.getElementById('expText').textContent = `${user.exp}/${levelInfo.expRequired} EXP`;

        // 更新积分和连续天数
        document.getElementById('totalPoints').textContent = user.points;
        document.getElementById('shopPoints').textContent = user.points;
        document.getElementById('streakDays').textContent = user.streakDays;
    }

    // 获取等级信息
    getLevelInfo(level) {
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

    // 添加经验值
    addExp(amount) {
        this.data.user.exp += amount;
        
        // 检查升级
        const currentLevel = this.data.user.level;
        const levelInfo = this.getLevelInfo(currentLevel);
        
        if (this.data.user.exp >= levelInfo.expRequired && currentLevel < 6) {
            this.data.user.level++;
            this.data.user.exp = 0;
            this.showLevelUpNotification();
        }
        
        this.updateUI();
        this.saveData();
    }

    // 添加积分
    addPoints(amount) {
        this.data.user.points += amount;
        this.updateUI();
        this.saveData();
    }

    // 显示升级通知
    showLevelUpNotification() {
        const levelInfo = this.getLevelInfo(this.data.user.level);
        alert(`🎉 恭喜升级！你现在是 Lv.${this.data.user.level} ${levelInfo.title}！`);
    }

    // 更新统计数据
    updateStats() {
        const subjects = [...new Set(this.data.grades.map(g => g.subject))];
        const avgScore = this.data.grades.length > 0 
            ? Math.round(this.data.grades.reduce((sum, g) => sum + (g.score / g.fullScore * 100), 0) / this.data.grades.length)
            : 0;

        document.getElementById('totalSubjects').textContent = subjects.length;
        document.getElementById('avgScore').textContent = avgScore;
        document.getElementById('studyDays').textContent = this.data.studyMethods.studyDays;
        document.getElementById('totalPapers').textContent = this.data.papers.length;
    }

    // 渲染仪表盘
    renderDashboard() {
        this.renderGradeChart();
        this.renderRecentActivities();
    }

    // 渲染成绩图表
    renderGradeChart() {
        const ctx = document.getElementById('gradeChart');
        if (!ctx) return;
        
        if (this.gradeChart) {
            this.gradeChart.destroy();
        }

        const subjects = [...new Set(this.data.grades.map(g => g.subject))];
        
        if (subjects.length === 0) {
            // 如果没有数据，显示空图表
            this.gradeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: '分数 (%)'
                            }
                        }
                    }
                }
            });
            return;
        }

        const datasets = subjects.map((subject, index) => {
            const subjectGrades = this.data.grades
                .filter(g => g.subject === subject)
                .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
                .map(g => ({
                    x: g.examDate,
                    y: Math.round(g.score / g.fullScore * 100)
                }));

            const colors = ['#667eea', '#764ba2', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
            
            return {
                label: subject,
                data: subjectGrades,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                tension: 0.4
            };
        });

        this.gradeChart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数 (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }

    // 渲染最近活动
    renderRecentActivities() {
        const container = document.getElementById('recentActivities');
        const activities = [];

        // 添加最近的成绩记录
        this.data.grades.slice(-3).forEach(grade => {
            activities.push({
                type: 'grade',
                text: `录入了${grade.subject}成绩：${grade.score}/${grade.fullScore}`,
                date: grade.examDate
            });
        });

        // 添加最近的试卷记录
        this.data.papers.slice(-2).forEach(paper => {
            activities.push({
                type: 'paper',
                text: `整理了${paper.subject}试卷：${paper.title}`,
                date: paper.date
            });
        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (activities.length === 0) {
            container.innerHTML = '<p class="no-data">暂无活动记录</p>';
            return;
        }

        container.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <i class="fas fa-${activity.type === 'grade' ? 'chart-line' : 'file-alt'}"></i>
                <span>${activity.text}</span>
                <small>${activity.date}</small>
            </div>
        `).join('');
    }

    // 显示添加成绩模态框
    showAddGradeModal() {
        const modal = document.getElementById('addGradeModal');
        if (modal) {
            modal.style.display = 'block';
            const examDate = document.getElementById('examDate');
            if (examDate) {
                examDate.value = new Date().toISOString().split('T')[0];
            }
        }
    }

    // 添加成绩
    addGrade() {
        const formData = {
            subject: document.getElementById('subject').value,
            score: parseInt(document.getElementById('score').value),
            fullScore: parseInt(document.getElementById('fullScore').value),
            examDate: document.getElementById('examDate').value,
            examType: document.getElementById('examType').value,
            notes: document.getElementById('notes').value,
            id: Date.now()
        };

        this.data.grades.push(formData);
        
        // 奖励经验和积分
        this.addExp(20);
        this.addPoints(10);
        
        this.saveData();
        this.updateStats();
        this.closeModal('addGradeModal');
        this.renderDashboard();
        this.renderGrades();
        this.checkAchievements();
        
        // 重置表单
        document.getElementById('gradeForm').reset();
        
        alert('成绩添加成功！获得 20 EXP 和 10 积分！');
    }

    // 渲染成绩管理
    renderGrades() {
        const subjectsGrid = document.getElementById('subjectsGrid');
        const subjects = [...new Set(this.data.grades.map(g => g.subject))];

        if (subjects.length === 0) {
            subjectsGrid.innerHTML = '<p class="no-data">暂无成绩记录</p>';
            return;
        }

        subjectsGrid.innerHTML = subjects.map(subject => {
            const subjectGrades = this.data.grades.filter(g => g.subject === subject);
            const avgScore = Math.round(subjectGrades.reduce((sum, g) => sum + (g.score / g.fullScore * 100), 0) / subjectGrades.length);
            
            // 计算趋势
            const recentGrades = subjectGrades.slice(-2);
            let trend = '';
            if (recentGrades.length >= 2) {
                const recent = recentGrades[1].score / recentGrades[1].fullScore * 100;
                const previous = recentGrades[0].score / recentGrades[0].fullScore * 100;
                if (recent > previous) trend = '📈 上升';
                else if (recent < previous) trend = '📉 下降';
                else trend = '➡️ 持平';
            }

            return `
                <div class="subject-card" onclick="showSubjectDetails('${subject}')">
                    <h4>${subject}</h4>
                    <div class="subject-score">${avgScore}%</div>
                    <div class="subject-trend">${trend}</div>
                </div>
            `;
        }).join('');
    }

    // 显示科目详情
    showSubjectDetails(subject) {
        const subjectGrades = this.data.grades
            .filter(g => g.subject === subject)
            .sort((a, b) => new Date(b.examDate) - new Date(a.examDate));

        const detailsContainer = document.getElementById('gradeDetails');
        
        detailsContainer.innerHTML = `
            <h4>${subject} 成绩详情</h4>
            <div class="grade-list">
                ${subjectGrades.map(grade => `
                    <div class="grade-item">
                        <div class="grade-header">
                            <span class="grade-type">${grade.examType}</span>
                            <span class="grade-date">${grade.examDate}</span>
                        </div>
                        <div class="grade-score">${grade.score}/${grade.fullScore} (${Math.round(grade.score / grade.fullScore * 100)}%)</div>
                        ${grade.notes ? `<div class="grade-notes">${grade.notes}</div>` : ''}
                        <div class="grade-actions">
                            <button class="btn btn-small btn-secondary" onclick="editGrade(${grade.id})">编辑</button>
                            <button class="btn btn-small btn-danger" onclick="deleteGrade(${grade.id})">删除</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 开始学习会话
    startStudySession() {
        this.data.studyMethods.studyDays++;
        this.addExp(10);
        this.addPoints(5);
        this.saveData();
        this.updateStats();
        alert('开始学习会话！获得 10 EXP 和 5 积分！');
    }

    // 番茄工作法
    startPomodoro() {
        document.getElementById('pomodoroTimer').style.display = 'flex';
        this.resetPomodoro();
    }

    closePomodoroTimer() {
        document.getElementById('pomodoroTimer').style.display = 'none';
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
        }
    }

    startPomodoroTimer() {
        if (this.pomodoroState.isRunning) return;
        
        this.pomodoroState.isRunning = true;
        document.getElementById('timerStatus').textContent = this.pomodoroState.isBreak ? '休息时间' : '专注学习';
        
        this.pomodoroTimer = setInterval(() => {
            this.pomodoroState.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.pomodoroState.timeLeft <= 0) {
                this.pomodoroComplete();
            }
        }, 1000);
    }

    pausePomodoroTimer() {
        this.pomodoroState.isRunning = false;
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
        }
        document.getElementById('timerStatus').textContent = '已暂停';
    }

    resetPomodoroTimer() {
        this.pomodoroState.isRunning = false;
        this.pomodoroState.timeLeft = this.pomodoroState.isBreak ? 5 * 60 : 25 * 60;
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
        }
        this.updateTimerDisplay();
        document.getElementById('timerStatus').textContent = '准备开始';
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.pomodoroState.timeLeft / 60);
        const seconds = this.pomodoroState.timeLeft % 60;
        document.getElementById('timerDisplay').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    pomodoroComplete() {
        this.pomodoroState.isRunning = false;
        clearInterval(this.pomodoroTimer);
        
        if (!this.pomodoroState.isBreak) {
            // 完成一个番茄钟
            this.data.studyMethods.pomodoroSessions++;
            this.addExp(25);
            this.addPoints(15);
            alert('🍅 番茄钟完成！获得 25 EXP 和 15 积分！现在休息 5 分钟。');
            this.pomodoroState.isBreak = true;
            this.pomodoroState.timeLeft = 5 * 60;
        } else {
            // 休息结束
            alert('休息结束！准备开始下一个番茄钟。');
            this.pomodoroState.isBreak = false;
            this.pomodoroState.timeLeft = 25 * 60;
        }
        
        this.updateTimerDisplay();
        this.saveData();
        this.checkAchievements();
    }

    // 渲染学习方法
    renderStudyMethods() {
        // 学习方法已在HTML中定义，这里可以添加动态内容
    }

    // 显示费曼学习法指导
    showFeynmanGuide() {
        alert(`费曼学习法四步骤：
1. 选择一个概念
2. 用简单的话解释给别人听
3. 发现不懂的地方，回去学习
4. 简化和类比，直到能清楚解释

这个方法能帮你真正理解知识！`);
    }

    // 创建复习计划
    createReviewPlan() {
        alert(`间隔重复复习计划：
第1天：学习新内容
第2天：第一次复习
第4天：第二次复习
第7天：第三次复习
第15天：第四次复习
第30天：第五次复习

按照这个计划复习，记忆效果最佳！`);
    }

    // 设定SMART目标
    setSmartGoal() {
        const goal = prompt(`设定你的SMART学习目标：

S - 具体的 (Specific)
M - 可衡量的 (Measurable)  
A - 可达成的 (Achievable)
R - 相关的 (Relevant)
T - 有时限的 (Time-bound)

例如：在下次月考中，数学成绩提高到85分以上`);
        
        if (goal) {
            alert('目标设定成功！记得定期检查进度哦！');
            this.addExp(15);
            this.addPoints(10);
            this.saveData();
        }
    }

    // 创建思维导图
    createMindMap() {
        alert(`思维导图创建步骤：
1. 在中心写下主题
2. 从中心向外画分支
3. 每个分支写一个关键词
4. 继续细分子分支
5. 使用颜色和图像

推荐工具：XMind、MindMaster、百度脑图`);
    }

    // 打开错题本
    openMistakeBook() {
        alert('错题本功能开发中...敬请期待！');
    }

    // 显示添加试卷模态框
    showAddPaperModal() {
        document.getElementById('addPaperModal').style.display = 'block';
        document.getElementById('paperDate').value = new Date().toISOString().split('T')[0];
    }

    // 添加试卷
    addPaper() {
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

        this.data.papers.push(formData);
        
        // 奖励经验和积分
        this.addExp(15);
        this.addPoints(8);
        
        this.saveData();
        this.updateStats();
        this.closeModal('addPaperModal');
        this.renderPapers();
        this.checkAchievements();
        
        // 重置表单
        document.getElementById('paperForm').reset();
        
        alert('试卷添加成功！获得 15 EXP 和 8 积分！');
    }

    // 渲染试卷
    renderPapers() {
        this.updatePaperFilters();
        this.filterPapers();
    }

    // 更新试卷筛选器
    updatePaperFilters() {
        const subjectFilter = document.getElementById('subjectFilter');
        const subjects = [...new Set(this.data.papers.map(p => p.subject))];
        
        subjectFilter.innerHTML = '<option value="">所有科目</option>' +
            subjects.map(subject => `<option value="${subject}">${subject}</option>`).join('');
    }

    // 筛选试卷
    filterPapers() {
        const subjectFilter = document.getElementById('subjectFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const searchTerm = document.getElementById('searchPapers').value.toLowerCase();
        
        let filteredPapers = this.data.papers.filter(paper => {
            const matchSubject = !subjectFilter || paper.subject === subjectFilter;
            const matchType = !typeFilter || paper.type === typeFilter;
            const matchSearch = !searchTerm || 
                paper.title.toLowerCase().includes(searchTerm) ||
                paper.subject.toLowerCase().includes(searchTerm);
            
            return matchSubject && matchType && matchSearch;
        });

        this.renderPaperGrid(filteredPapers);
    }

    // 渲染试卷网格
    renderPaperGrid(papers) {
        const papersGrid = document.getElementById('papersGrid');
        
        if (papers.length === 0) {
            papersGrid.innerHTML = '<p class="no-data">没有找到匹配的试卷</p>';
            return;
        }

        papersGrid.innerHTML = papers.map(paper => {
            const percentage = paper.score && paper.fullScore ? 
                Math.round(paper.score / paper.fullScore * 100) : null;
            
            return `
                <div class="paper-card">
                    <div class="paper-header">
                        <div>
                            <div class="paper-title">${paper.title}</div>
                            <span class="paper-subject">${paper.subject}</span>
                        </div>
                        <div class="paper-score">
                            ${percentage !== null ? `${percentage}%` : '未评分'}
                        </div>
                    </div>
                    <div class="paper-date">${paper.date}</div>
                    ${paper.notes ? `<div class="paper-notes">${paper.notes}</div>` : ''}
                    <div class="paper-actions">
                        <button class="btn btn-small btn-secondary" onclick="editPaper(${paper.id})">编辑</button>
                        <button class="btn btn-small btn-danger" onclick="deletePaper(${paper.id})">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染成就系统
    renderAchievements() {
        this.renderAchievementBadges();
        this.renderProgressList();
    }

    // 渲染成就徽章
    renderAchievementBadges() {
        const achievementsGrid = document.getElementById('achievementsGrid');
        const achievements = this.getAchievements();
        
        achievementsGrid.innerHTML = achievements.map(achievement => `
            <div class="achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `).join('');
    }

    // 获取成就列表
    getAchievements() {
        const gradeCount = this.data.grades.length;
        const paperCount = this.data.papers.length;
        const pomodoroCount = this.data.studyMethods.pomodoroSessions;
        const avgScore = this.data.grades.length > 0 
            ? this.data.grades.reduce((sum, g) => sum + (g.score / g.fullScore * 100), 0) / this.data.grades.length
            : 0;

        return [
            {
                id: 'first_grade',
                name: '初次记录',
                description: '录入第一个成绩',
                icon: '🎯',
                unlocked: gradeCount >= 1
            },
            {
                id: 'grade_master',
                name: '成绩达人',
                description: '录入10个成绩',
                icon: '📊',
                unlocked: gradeCount >= 10
            },
            {
                id: 'high_achiever',
                name: '学霸',
                description: '平均分达到90分',
                icon: '🏆',
                unlocked: avgScore >= 90
            },
            {
                id: 'paper_collector',
                name: '试卷收集家',
                description: '整理5份试卷',
                icon: '📝',
                unlocked: paperCount >= 5
            },
            {
                id: 'pomodoro_starter',
                name: '番茄新手',
                description: '完成第一个番茄钟',
                icon: '🍅',
                unlocked: pomodoroCount >= 1
            },
            {
                id: 'pomodoro_master',
                name: '番茄大师',
                description: '完成50个番茄钟',
                icon: '🔥',
                unlocked: pomodoroCount >= 50
            },
            {
                id: 'consistent_learner',
                name: '坚持学习',
                description: '连续学习7天',
                icon: '💪',
                unlocked: this.data.user.streakDays >= 7
            },
            {
                id: 'level_up',
                name: '等级提升',
                description: '达到3级',
                icon: '⭐',
                unlocked: this.data.user.level >= 3
            }
        ];
    }

    // 渲染进度列表
    renderProgressList() {
        const progressList = document.getElementById('progressList');
        const progress = [
            {
                name: '成绩记录进度',
                current: this.data.grades.length,
                target: 20,
                unit: '个'
            },
            {
                name: '试卷整理进度',
                current: this.data.papers.length,
                target: 10,
                unit: '份'
            },
            {
                name: '番茄钟进度',
                current: this.data.studyMethods.pomodoroSessions,
                target: 100,
                unit: '个'
            },
            {
                name: '连续学习进度',
                current: this.data.user.streakDays,
                target: 30,
                unit: '天'
            }
        ];

        progressList.innerHTML = progress.map(item => {
            const percentage = Math.min((item.current / item.target) * 100, 100);
            return `
                <div class="progress-item">
                    <div class="progress-header">
                        <span>${item.name}</span>
                        <span>${item.current}/${item.target} ${item.unit}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 检查成就
    checkAchievements() {
        const achievements = this.getAchievements();
        const newAchievements = achievements.filter(a => 
            a.unlocked && !this.data.achievements.includes(a.id)
        );

        newAchievements.forEach(achievement => {
            this.data.achievements.push(achievement.id);
            this.addPoints(50);
            alert(`🏆 解锁新成就：${achievement.name}！获得 50 积分！`);
        });

        if (newAchievements.length > 0) {
            this.saveData();
        }
    }

    // 渲染商城
    renderShop() {
        const shopGrid = document.getElementById('shopGrid');
        const items = this.getShopItems();
        
        shopGrid.innerHTML = items.map(item => `
            <div class="shop-item ${this.data.shop.purchased.includes(item.id) ? 'purchased' : ''}">
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.description}</div>
                <div class="item-price">
                    <i class="fas fa-coins"></i> ${item.price}
                </div>
                <button class="btn btn-primary" 
                    onclick="buyItem('${item.id}')"
                    ${this.data.shop.purchased.includes(item.id) || this.data.user.points < item.price ? 'disabled' : ''}>
                    ${this.data.shop.purchased.includes(item.id) ? '已购买' : '购买'}
                </button>
            </div>
        `).join('');
    }

    // 获取商城物品
    getShopItems() {
        return [
            {
                id: 'theme_dark',
                name: '暗黑主题',
                description: '酷炫的暗黑模式界面',
                icon: '🌙',
                price: 100
            },
            {
                id: 'custom_avatar',
                name: '自定义头像',
                description: '个性化你的头像',
                icon: '👤',
                price: 150
            },
            {
                id: 'advanced_stats',
                name: '高级统计',
                description: '更详细的学习数据分析',
                icon: '📈',
                price: 200
            },
            {
                id: 'study_music',
                name: '专注音乐',
                description: '学习时的背景音乐',
                icon: '🎵',
                price: 80
            },
            {
                id: 'reminder_system',
                name: '智能提醒',
                description: '学习和复习提醒功能',
                icon: '⏰',
                price: 120
            },
            {
                id: 'export_data',
                name: '数据导出',
                description: '导出学习数据报告',
                icon: '📊',
                price: 180
            }
        ];
    }

    // 购买物品
    buyItem(itemId) {
        const item = this.getShopItems().find(i => i.id === itemId);
        if (!item) return;

        if (this.data.user.points < item.price) {
            alert('积分不足！');
            return;
        }

        if (this.data.shop.purchased.includes(itemId)) {
            alert('已经购买过了！');
            return;
        }

        this.data.user.points -= item.price;
        this.data.shop.purchased.push(itemId);
        this.saveData();
        this.updateUI();
        this.renderShop();
        
        alert(`🎉 购买成功！${item.name} 已添加到你的账户！`);
    }

    // 更新每日连续天数
    updateDailyStreak() {
        const today = new Date().toDateString();
        const lastActive = this.data.user.lastActiveDate;
        
        if (lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastActive === yesterday.toDateString()) {
                // 连续天数+1
                this.data.user.streakDays++;
            } else if (lastActive !== null) {
                // 重置连续天数
                this.data.user.streakDays = 1;
            } else {
                // 第一次使用
                this.data.user.streakDays = 1;
            }
            
            this.data.user.lastActiveDate = today;
            this.saveData();
        }
    }

    // 关闭模态框
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

// 全局函数
function showAddGradeModal() {
    app.showAddGradeModal();
}

function showAddPaperModal() {
    app.showAddPaperModal();
}

function closeModal(modalId) {
    app.closeModal(modalId);
}

function startStudySession() {
    app.startStudySession();
}

function startPomodoro() {
    app.startPomodoro();
}

function closePomodoroTimer() {
    app.closePomodoroTimer();
}

function showSubjectDetails(subject) {
    app.showSubjectDetails(subject);
}

function filterPapers() {
    app.filterPapers();
}

function buyItem(itemId) {
    app.buyItem(itemId);
}

function showFeynmanGuide() {
    app.showFeynmanGuide();
}

function createReviewPlan() {
    app.createReviewPlan();
}

function setSmartGoal() {
    app.setSmartGoal();
}

function createMindMap() {
    app.createMindMap();
}

function openMistakeBook() {
    app.openMistakeBook();
}

// 番茄钟控制函数
function startTimer() {
    app.startPomodoroTimer();
}

function pauseTimer() {
    app.pausePomodoroTimer();
}

function resetTimer() {
    app.resetPomodoroTimer();
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StudyTracker();
    
    // 添加事件监听器到按钮
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');
    
    if (startBtn) startBtn.addEventListener('click', () => app.startPomodoroTimer());
    if (pauseBtn) pauseBtn.addEventListener('click', () => app.pausePomodoroTimer());
    if (resetBtn) resetBtn.addEventListener('click', () => app.resetPomodoroTimer());
});