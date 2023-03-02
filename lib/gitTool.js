import {exec} from 'child_process'
import {promptType} from './inquirerTools.js'
export default  class GitTools {

	/**
	 * 构造函数
	 * @param {String} cwd 工作目录
	 * */
	constructor(option) {
		this.option = option;
	}

	/**
	 * git add
	 * */
	add() {
		const params = 'git add .'
		return this.startChildProcess(params);
	}

	/**
	 * git commit
	 * @param {String} remark 备注信息
	 * */
	async commit({commit}) {
        if(!commit){
			commit =(await promptType('commit')).commit
        }
		const params = `git commit -m "${commit}"`
		return this.startChildProcess( params);
	}
	/**
	 * git push
	 * @param {String} branch 分支名
	 * */
	push({branch}) {
        const params = branch ? `git push origin ${branch}` : 'git push'
		return this.startChildProcess(params);
	}

	/**
	 * git checkout
	 * @param {String} branch 分支名
	 * */
	async checkout({branch}) {
		if (!branch) {
			branch =(await promptType('branch')).branch
		}
        const params = `git checkout ${branch}`
        const {currentBranch,branchList} = await this.branch()
        if(branch !== currentBranch){
            const isChange = await this.status()
            if(isChange){
                return new Error('当前有修改未提交无法切换分支!') 
            }
            await this.startChildProcess(params);

        }
	}

	/**
	 * git pull
	 * @param {String} branch 分支名
	 * */
	pull({branch}) {
        const params = branch ? `git pull origin ${branch}` :'git pull'
		return this.startChildProcess(params);
	}

	/**
	 * git pull
	 * @return {Boolean} 是否存在修改
	 * */
	async status() {
		try {
			const params = 'git status -s'
			let result = await this.startChildProcess( params);
			console.log(result,'-----')
			return !!result
		} catch (err) {
			console.error(err);
		}
		return false;
	}
	async merge({branch}){
		const params = `git merge ${branch}`
		return await this.startChildProcess(params);
	}
	/**
	 * git branch
	 * @return {String} currentBranch 当前分支
	 * @return {Array} branchList 当前本地所有分支
	 * */
	async branch() {
		const params = 'git branch'
		const result = await this.startChildProcess(params);
		let currentBranch = '';
		const branchList = result.split('\n').map(item => {
			var reg = new RegExp(/\*/g);
			if (reg.test(item)) {
				item = item.replace(reg, '');
				currentBranch = item.trim();
			}
			return item.trim();
		}).filter(item => item);
		return {currentBranch,branchList}
	}
    async newBranch({branch,serveBranch}){
        if (!branch) {
			branch =(await promptType('branch')).branch
		}
        serveBranch || (serveBranch = branch)
		const isChange = await this.status()
		if(isChange){
			return  new Error('当前有修改未提交无法切换分支!') 
		}
        const params = `git checkout -b ${branch} origin/${serveBranch}`
        await this.startChildProcess(params)
    }


	/**
	 * 开启子进程
	 * @param {String} command  命令 (git/node...)
	 * @param {Array} params 参数
	 * */
	startChildProcess(params) {
		return new Promise((resolve, reject) => {
			exec(params,(err, stdout, stderr) => {
                resolve(stdout)
				if(err){
					reject(err)
				}else{
					resolve(stdout)
				}
              });
		})
	}


	/**
	 * 切换分支并拉取最新代码
	 * @param {String} branch 目标分支 
	 * */
	async switchBreach({branch}) {

		try {
			// 切分支
			await this.checkout(branch);

			// 拉取最新代码
			await this.pull(branch);
			
			return true;

		} catch (err) {
			console.error(err);
		}

		return false;
	}

	/**
	 * 自动上传
	 * @param {String} remark 备注的信息 
	 * @param {String} branch 目标分支 
	 * */
	async autoUpload({commit, branch,newBranch}) {
		try {
			// git add .
			await this.add();

			// git status -s
			var isChange = await this.status();

			if (isChange) {
				// 提交备注
				await this.commit({commit});
				// git pull branch
				await this.pull({branch});
				await this.push({branch});
				// 切换分支
				await this.checkout({branch:newBranch})
				await this.pull({branch:newBranch})
				// 合并分支
				await this.merge({branch})
				await this.push()
			} else {
				console.log('not have to upload');
			}

			console.log('auto upload success !');

			return true;
		} catch (err) {
			console.error(err);
		}

		console.log('auto upload error !');
		return false;
	}
}