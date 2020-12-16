// 由于考虑到各个对象都要使用计时器，所以我们封装一个计时器的方法
// 后面各个对象要使用计时器的话，直接调用该方法即可

// 通过这个函数，我们可以统一的给对象绑定一个计时器
// 该函数返回一个计时器对象，计时器对像会提供两个方法：start（开启计时器） stop（停止计时器）
// getTimer 接收三个参数 1. duration（setInterval 的第二个参数）
//                     2. thisObj（要绑定到哪一个对象上面）
//                     3. callback（setInterval 的第一个参数）
function getTimer(duration, thisObj, callback) {
    let timer = null; // 用来存储 setInterval 的返回值，后面可以停止计时器
    return {
        start: function () {
            if (!timer) {
                timer = setInterval(function () {
                    callback.bind(thisObj)();
                }, duration)
            }
        },
        stop: function () {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }
    }
}

// 游戏对象
const game = {
    width: 800,
    height: 600,
    dom: document.getElementById("game"),
    maxHeight: 600 - 112, // 小鸟能够活动的最大高度 = 场景高度 - 大地高度
    paused: false, // 该属性决定游戏是否暂停
    score: 0, // 游戏的分数
    max_score: localStorage.getItem("maxScore"), //从本地存储中取最高分
    isGameOver: false, // 游戏是否结束
    // 游戏开始的方法
    start: function () {
        sky.timer.start();
        land.timer.start();
        pipes.produceTimer.start();
        pipes.moveTimer.start();
        bird.wingTimer.start();
        bird.dropTimer.start();
        gameover_scr.style.display = 'none';
        gameMenu.style.display = 'none';
    },
    // 游戏结束的方法
    stop: function () {
        sky.timer.stop();
        land.timer.stop();
        pipes.produceTimer.stop();
        pipes.moveTimer.stop();
        bird.wingTimer.stop();
        bird.dropTimer.stop();
        gameover_scr.style.display = 'block';
        if (this.max_score == null || this.max_score < this.score) {
            localStorage.setItem('maxScore', this.score);
            this.max_score = this.score;
        }
        if (this.isGameOver) {
            if (this.score < 10) {
                gameover_scr.innerHTML = `
                <h1>游戏结束</h1>
                <h2>您的分数是 ${this.score} 分</h2>
                <h2>历史最高分数为 ${this.max_score} 分</h2>
                <h3>按回车键重试</h3>
                <h1 style="color: red;font-weight: 800;">不是吧不是吧，不会真的有人连10分都玩不到吧？？？</h1>
            `;
            } else {
                gameover_scr.innerHTML = `
                <h1>游戏结束</h1>
                <h2>您的分数是 ${this.score} 分</h2>
                <h2>历史最高分数为 ${this.max_score} 分</h2>
                <h3>按回车键重试</h3>
            `;
            }
        } else {
            gameover_scr.innerHTML = `
                <h1>游戏暂停</h1>
                <h2>您目前的分数是 ${this.score} 分</h2>
                <h3>按回车键继续</h3>
            `;
        }
    },
    // 游戏结束方法
    gameover: function () {
        // 要判断游戏是否结束，有两个条件
        // 1. 小鸟是否落地 2. 小鸟是否碰到柱子
        // 判断小鸟是否落地
        if (bird.top === game.maxHeight - bird.height) {
            this.isGameOver = true;
            this.stop();
            return;
        }
        // 接下来还需要判断小鸟是否碰到柱子
        // 首先我们需要获取小鸟 x 轴和 y 轴的中心点
        let bx = bird.left + bird.width / 2;
        let by = bird.top + bird.height / 2;
        // 接下来我们需要判断小鸟是否和柱子相碰撞
        for (let i = 0; i < pipes.all.length; i++) {
            let p = pipes.all[i]; // 获取当前的柱子
            // 接下来就要进行两个矩形是否碰撞的判断
            // 横向：｜矩形1x中心点到矩形2x中心点｜<两个矩形宽度之和 / 2
            // 纵向：｜矩形1y中心点到矩形2y中心点｜<两个矩形高度之和 / 2
            let px = p.left + p.width / 2; // 柱子 x 轴的中心点
            let py = p.top + p.height / 2; // 柱子 x 轴的中心点
            if (Math.abs(bx - px) < (p.width + bird.width) / 2 && Math.abs(by - py) < (p.height + bird.height) / 2) {
                this.isGameOver = true;
                this.stop();
                return;
            }
        }
    }
}

// 天空对象
const sky = {
    left: 0,
    dom: document.getElementById("sky"),
    show: function () {
        // 重新更新天空的 left 值
        this.dom.style.left = this.left + `px`;
    }
}

sky.timer = getTimer(30, sky, function () {
    this.left -= 1;
    if (this.left === -game.width) {
        this.left = 0;
    }
    this.show();
})

// 大地对象
const land = {
    left: 0,
    dom: document.getElementById("land"),
    show: function () {
        // 重新更新天空的 left 值
        this.dom.style.left = this.left + `px`;
    }
}
land.timer = getTimer(15, land, function () {
    this.left -= 1;
    if (this.left === -game.width) {
        this.left = 0;
    }
    this.show();
});

// 柱子对象
const pipes = {
    width: 52, // 柱子的宽度
    // 获取随机数的方法
    getRandom: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    all: [], // 保存所有的柱子
    // 创建柱子的方法
    createPair: function () {
        const minHeight = 60, // 柱子的最小高度
            gap = 150, // 上下柱子的间隙
            maxHeight = game.maxHeight - minHeight - gap; // 柱子的最高高度
        // 接下来我们就需要随机生成一组柱子
        const h1 = this.getRandom(minHeight, maxHeight); // 柱子上方高度
        const h2 = game.maxHeight - h1 - gap; // 柱子下方的高度
        // 接下来开始实际的创建柱子
        const div1 = document.createElement("div");
        div1.className = `pipeup`;
        div1.style.height = h1 + `px`;
        div1.style.left = game.width + `px`;
        // 将上方的柱子添加到页面里面
        game.dom.appendChild(div1);
        // 接下来将创建的柱子的信息组成对象放入到数组里面
        // 对象里面会记录一些柱子的关键信息
        this.all.push({
            dom: div1,
            height: h1,
            width: this.width,
            top: 0,
            left: game.width
        })
        // 创建下面的柱子（1. 添加 dom 元素 2. 推入到数组）
        const div2 = document.createElement("div");
        div2.className = `pipedown`;
        div2.style.height = h2 + `px`;
        div2.style.left = game.width + `px`;
        game.dom.appendChild(div2);
        this.all.push({
            dom: div2,
            height: h2,
            width: this.width,
            top: h1 + gap, // 下方柱子的 top = 上面柱子的高度 + 空隙
            left: game.width
        })
    }
}

// 经过分析，我们知道，柱子应该有两个计时器
// 一个计时器负责生产柱子，另一个计时器负责移动所有的柱子
pipes.produceTimer = getTimer(2500, pipes, function () {
    this.createPair();
})
// 移动柱子的计时器
pipes.moveTimer = getTimer(30, pipes, function () {
    // 通过 for 循环移动了每一根柱子
    for (let i = 0; i < this.all.length; i++) {
        const p = this.all[i]; // 取出当前的柱子
        p.left -= 2; // 柱子不停移动
        // 判断柱子是否移出舞台
        if (p.left < -p.width) {
            p.dom.remove(); // 删除当前的柱子
            this.all.splice(i, 1); // 将该柱子从数组中删除
            i--;
        } else {
            // 如果进入到 else，说明柱子还没有移出舞台
            p.dom.style.left = p.left + 'px';
        }
        if (i % 2 == 0) {
            //因为柱子是上下两根，所以要除以2
            if (p.left == bird.left) {
                //当柱子距离和鸟距离左侧边距相等时，说明柱子经过鸟，此时分数自加
                game.score++;
            }
        }
    }
    // 判断游戏是否结束
    game.gameover(); // 每次柱子移动一次，都需要判断一下游戏是否结束
})

// 小鸟对象
const bird = {
    width: 33, // 小鸟图片的宽度
    height: 26, // 小鸟图片的高度
    top: 150, // 默认游戏开始时小鸟的 top 位置
    left: 200, // 默认游戏开始时小鸟的 left 位置
    dom: document.getElementById("bird"),
    wingIndex: 0, // 记录当前小鸟的图片索引，翅膀处于哪一个位置
    speed: 0, // 初始速度，向下的速度，每毫秒移动的像素值
    a: 0.002, // 加速度
    // 显示小鸟最新的状态的方法
    show: function () {
        // 设置新的 top 值
        this.dom.style.top = this.top + `px`;
        // 根据图片的索引值，来决定背景图的位置
        if (this.wingIndex === 0) {
            this.dom.style.backgroundPosition = '-8px -10px';
        } else if (this.wingIndex === 1) {
            this.dom.style.backgroundPosition = '-60px -10px';
        } else {
            this.dom.style.backgroundPosition = '-113px -10px';
        }
    },
    // 设置小鸟当前高度的方法，这个方法主要就是判断 top 有没有超出界限
    setTop: function (newTop) {
        if (newTop < 0) {
            newTop = 0;
        } else if (newTop > game.maxHeight - this.height) {
            newTop = game.maxHeight - this.height;
        }
        this.top = newTop;
    },
    // 小鸟的跳跃方法
    jump: function () {
        this.speed = -0.5;
    }
}
// 小鸟的计时器
// 通过分析，我们可以知道，小鸟和柱子一样，也应该有两个计时器
// 一个计时器负责修改 wingIndex 另一个计时器负责修改 top 值
bird.wingTimer = getTimer(100, bird, function () {
    this.wingIndex = (this.wingIndex + 1) % 3;
    this.show();
});
// 这里会涉及到物理匀加速运动 S = vt + 1/2 * a * t * t
// 这个公式就是计算在一定的加速度下，一定时间后运动的距离
// 还会使用一个公式：v = v0 + a * t 这个公式主要是获取到一定时间后匀加速的末速度是多少
bird.dropTimer = getTimer(16, bird, function () {
    // 每过 16 毫秒，我们就需要去计算小鸟现在向下移动的位移情况
    let s = this.speed * 16 + 0.5 * this.a * 16 * 16; // 16 毫秒运动的距离
    // 接下来就需要重新设置小鸟的 top
    this.setTop(this.top + s);
    // 接下来需要更新速度，因为下一个 16 毫秒的初速度就是上一次的末速度
    this.speed = this.speed + this.a * 16;
    this.show();
});

// 绑定键盘事件
document.documentElement.onkeydown = function (e) {
    if (e.key == ' ') {
        bird.jump();
    } else if (e.key === 'Enter') {
        if (game.isGameOver) {
            location.reload();
        } else {
            if (game.paused) {
                game.start();
                game.paused = false;
            } else {
                game.stop();
                game.paused = true;
            }
        }
    }
}
//绑定开始按钮
startBtn.onclick = _ => {
    game.start();
}