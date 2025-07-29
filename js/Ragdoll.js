/**
 * Sistema de Ragdoll Inteligente com IA de Combate
 * Criado para simular comportamento humano realista
 * Inclui física avançada, sistema de combate e personalização visual
 */

class Ragdoll {
    constructor(x, y, world, render) {
        this.world = world;
        this.render = render;
        this.id = this.generateUniqueId();
        
        // Sistema de estados comportamentais
        this.state = 'BALANCING';
        this.isActive = true;
        this.health = 100;
        this.stamina = 100;
        this.stability = 0;
        
        // Personalidade e aparência única
        this.personality = this.generatePersonality();
        this.appearance = this.generateAppearance();
        
        // Sistema de combate avançado
        this.combat = {
            target: null,
            lastScan: 0,
            scanInterval: 120,
            attackCooldown: 0,
            attackDuration: 0,
            isAttacking: false,
            staggerTime: 0,
            combatStyle: this.personality.aggression > 0.7 ? 'aggressive' : 'defensive'
        };
        
        // Sistema de movimento natural
        this.movement = {
            walkCycle: 0,
            stepPhase: 0,
            lastStep: 0,
            walkSpeed: 0.8 + Math.random() * 0.4,
            balance: 0
        };
        
        // Configurações físicas
        this.bodyConfig = {
            head: { width: 30, height: 30, mass: 0.8 },
            torso: { width: 40, height: 60, mass: 2.0 },
            arm: { width: 15, height: 40, mass: 0.5 },
            leg: { width: 20, height: 50, mass: 0.8 }
        };
        
        // Configurações de controle
        this.controlConfig = {
            maxForce: 0.01,
            balanceThreshold: 0.2,
            stabilityTarget: 0.8,
            energyDecay: 0.1,
            recoveryRate: 0.5
        };
        
        // Criar partes do corpo
        this.createBodyParts(x, y);
        this.createConstraints();
        
        // Sistema de debug visual
        this.debugVisuals = {
            centerOfMass: null,
            forceVectors: [],
            showDebug: true
        };
        
        console.log(`🤖 Ragdoll Ativo criado! ID: ${this.id}`);
    }
    
    /**
     * Gera um ID único para cada ragdoll
     */
    generateUniqueId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 5);
        return `fighter_${timestamp}_${randomStr}`;
    }
    
    /**
     * Gera personalidade única para cada ragdoll
     */
    generatePersonality() {
        return {
            aggression: Math.random(),
            courage: Math.random(),
            intelligence: Math.random(),
            reflexes: 0.5 + Math.random() * 0.5,
            endurance: 0.6 + Math.random() * 0.4
        };
    }
    
    /**
     * Gera aparência visual única
     */
    generateAppearance() {
        const skinTones = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
        const shirtColors = ['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const pantColors = ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#16a085'];
        
        return {
            skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
            shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
            pantColor: pantColors[Math.floor(Math.random() * pantColors.length)],
            size: 0.9 + Math.random() * 0.2 // Variação de tamanho
        };
    }
    
    /**
     * Cria as partes do corpo com física realista e aparência personalizada
     */
    createBodyParts(x, y) {
        const { Bodies } = Matter;
        const size = this.appearance.size;
        
        // Cabeça com tom de pele personalizado
        this.head = Bodies.circle(x, y - 80 * size, (this.bodyConfig.head.width / 2) * size, {
            render: {
                fillStyle: this.appearance.skinTone,
                strokeStyle: '#2c1810',
                lineWidth: 1.5
            },
            density: this.bodyConfig.head.mass * this.personality.endurance,
            friction: 0.85,
            frictionAir: 0.008,
            restitution: 0.1,
            label: `${this.id}_head`
        });
        
        // Torso com cor de camisa personalizada
        this.torso = Bodies.rectangle(x, y - 40 * size, this.bodyConfig.torso.width * size, this.bodyConfig.torso.height * size, {
            render: {
                fillStyle: this.appearance.shirtColor,
                strokeStyle: '#1a1a1a',
                lineWidth: 1.5
            },
            density: this.bodyConfig.torso.mass * this.personality.endurance,
            friction: 0.85,
            frictionAir: 0.008,
            restitution: 0.1,
            label: `${this.id}_torso`
        });
        
        // Braços com tom de pele
        this.leftArm = Bodies.rectangle(x - 35 * size, y - 35 * size, this.bodyConfig.arm.width * size, this.bodyConfig.arm.height * size, {
            render: {
                fillStyle: this.appearance.skinTone,
                strokeStyle: '#2c1810',
                lineWidth: 1.5
            },
            density: this.bodyConfig.arm.mass * this.personality.reflexes,
            friction: 0.8,
            frictionAir: 0.006,
            restitution: 0.15,
            label: `${this.id}_leftArm`
        });
        
        this.rightArm = Bodies.rectangle(x + 35 * size, y - 35 * size, this.bodyConfig.arm.width * size, this.bodyConfig.arm.height * size, {
            render: {
                fillStyle: this.appearance.skinTone,
                strokeStyle: '#2c1810',
                lineWidth: 1.5
            },
            density: this.bodyConfig.arm.mass * this.personality.reflexes,
            friction: 0.8,
            frictionAir: 0.006,
            restitution: 0.15,
            label: `${this.id}_rightArm`
        });
        
        // Pernas com cor de calça personalizada
        this.leftLeg = Bodies.rectangle(x - 15 * size, y + 35 * size, this.bodyConfig.leg.width * size, this.bodyConfig.leg.height * size, {
            render: {
                fillStyle: this.appearance.pantColor,
                strokeStyle: '#1a1a1a',
                lineWidth: 1.5
            },
            density: this.bodyConfig.leg.mass * this.personality.endurance,
            friction: 0.95,
            frictionAir: 0.005,
            restitution: 0.05,
            label: `${this.id}_leftLeg`
        });
        
        this.rightLeg = Bodies.rectangle(x + 15 * size, y + 35 * size, this.bodyConfig.leg.width * size, this.bodyConfig.leg.height * size, {
            render: {
                fillStyle: this.appearance.pantColor,
                strokeStyle: '#1a1a1a',
                lineWidth: 1.5
            },
            density: this.bodyConfig.leg.mass * this.personality.endurance,
            friction: 0.95,
            frictionAir: 0.005,
            restitution: 0.05,
            label: `${this.id}_rightLeg`
        });
        
        // Organizar partes do corpo e adicionar ao mundo físico
        this.bodyParts = [this.head, this.torso, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg];
        Matter.World.add(this.world, this.bodyParts);
    }
    
    createConstraints() {
        const { Constraint } = Matter;
        
        // Pescoço (cabeça-torso)
        this.neckConstraint = Constraint.create({
            bodyA: this.head,
            bodyB: this.torso,
            pointA: { x: 0, y: 15 },
            pointB: { x: 0, y: -30 },
            length: 5,
            stiffness: 0.8,
            damping: 0.1,
            label: `ragdoll_${this.id}_neck`
        });
        
        // Ombros
        this.leftShoulderConstraint = Constraint.create({
            bodyA: this.torso,
            bodyB: this.leftArm,
            pointA: { x: -20, y: -20 },
            pointB: { x: 0, y: -20 },
            length: 5,
            stiffness: 0.7,
            damping: 0.1,
            label: `ragdoll_${this.id}_leftShoulder`
        });
        
        this.rightShoulderConstraint = Constraint.create({
            bodyA: this.torso,
            bodyB: this.rightArm,
            pointA: { x: 20, y: -20 },
            pointB: { x: 0, y: -20 },
            length: 5,
            stiffness: 0.7,
            damping: 0.1,
            label: `ragdoll_${this.id}_rightShoulder`
        });
        
        // Quadris
        this.leftHipConstraint = Constraint.create({
            bodyA: this.torso,
            bodyB: this.leftLeg,
            pointA: { x: -10, y: 30 },
            pointB: { x: 0, y: -25 },
            length: 5,
            stiffness: 0.8,
            damping: 0.1,
            label: `ragdoll_${this.id}_leftHip`
        });
        
        this.rightHipConstraint = Constraint.create({
            bodyA: this.torso,
            bodyB: this.rightLeg,
            pointA: { x: 10, y: 30 },
            pointB: { x: 0, y: -25 },
            length: 5,
            stiffness: 0.8,
            damping: 0.1,
            label: `ragdoll_${this.id}_rightHip`
        });
        
        this.constraints = [
            this.neckConstraint,
            this.leftShoulderConstraint,
            this.rightShoulderConstraint,
            this.leftHipConstraint,
            this.rightHipConstraint
        ];
        
        Matter.World.add(this.world, this.constraints);
    }
    
    // SISTEMA DE CONTROLE MOTOR
    applyForceToLimb(limbName, forceVector) {
        const limb = this[limbName];
        if (!limb || !this.isActive) return;
        
        // Limitar força máxima
        const forceMagnitude = Math.sqrt(forceVector.x ** 2 + forceVector.y ** 2);
        if (forceMagnitude > this.controlConfig.maxForce) {
            const scale = this.controlConfig.maxForce / forceMagnitude;
            forceVector.x *= scale;
            forceVector.y *= scale;
        }
        
        Matter.Body.applyForce(limb, limb.position, forceVector);
        
        // Registrar para debug visual
        if (this.debugVisuals.showDebug) {
            this.debugVisuals.forceVectors.push({
                position: { x: limb.position.x, y: limb.position.y },
                force: { x: forceVector.x * 1000, y: forceVector.y * 1000 }, // Escalar para visualização
                limb: limbName
            });
        }
    }
    
    // ANÁLISE DO ESTADO FÍSICO
    calculateCenterOfMass() {
        let totalMass = 0;
        let weightedX = 0;
        let weightedY = 0;
        
        this.bodyParts.forEach(part => {
            const mass = part.mass;
            totalMass += mass;
            weightedX += part.position.x * mass;
            weightedY += part.position.y * mass;
        });
        
        const centerOfMass = {
            x: weightedX / totalMass,
            y: weightedY / totalMass
        };
        
        // Atualizar debug visual
        this.debugVisuals.centerOfMass = centerOfMass;
        
        return centerOfMass;
    }
    
    calculateTorsoAngle() {
        return this.torso.angle;
    }
    
    calculateStability() {
        const torsoAngle = Math.abs(this.calculateTorsoAngle());
        const centerOfMass = this.calculateCenterOfMass();
        
        // Base de suporte (posição média dos pés)
        const supportBase = {
            x: (this.leftLeg.position.x + this.rightLeg.position.x) / 2,
            y: Math.max(this.leftLeg.position.y, this.rightLeg.position.y)
        };
        
        // Distância horizontal do centro de massa à base de suporte
        const horizontalOffset = Math.abs(centerOfMass.x - supportBase.x);
        
        // Calcular estabilidade (0 = instável, 1 = muito estável)
        const angleStability = Math.max(0, 1 - (torsoAngle / (Math.PI / 4))); // Penalizar ângulos > 45°
        const balanceStability = Math.max(0, 1 - (horizontalOffset / 50)); // Penalizar deslocamento > 50px
        
        this.stability = (angleStability + balanceStability) / 2;
        return this.stability;
    }
    
    // LOOP PRINCIPAL DE CONTROLE (O CÉREBRO)
    // PASSO 1: Sistema de Percepção - Detectar inimigos próximos
    perceive(allRagdolls) {
        const currentTime = Date.now();
        
        // Só escanear a cada intervalo definido (otimização)
        if (currentTime - this.combat.lastScan < this.combat.scanInterval) {
            return;
        }
        
        this.combat.lastScan = currentTime;
        let closestTarget = null;
        let closestDistance = Infinity;
        
        // Iterar sobre todos os ragdolls
        for (let ragdoll of allRagdolls) {
            // Não atacar a si mesmo e só atacar ragdolls ativos
            if (ragdoll.id === this.id || !ragdoll.isActive || ragdoll.health <= 0) {
                continue;
            }
            
            // Calcular distância entre os torsos
            const distance = Math.sqrt(
                Math.pow(this.torso.position.x - ragdoll.torso.position.x, 2) +
                Math.pow(this.torso.position.y - ragdoll.torso.position.y, 2)
            );
            
            // Encontrar o mais próximo
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = ragdoll;
            }
        }
        
        // Só considerar alvos dentro de um raio de detecção
        if (closestDistance < 200) {
            this.combat.target = closestTarget;
        } else {
            this.combat.target = null;
        }
    }
    
    update(allRagdolls = []) {
        if (!this.isActive || this.health <= 0) return;
        
        // Sistema de Percepção
        this.perceive(allRagdolls);
        
        // Limpar vetores de força do frame anterior
        this.debugVisuals.forceVectors = [];
        
        // Análise do estado atual
        const centerOfMass = this.calculateCenterOfMass();
        const torsoAngle = this.calculateTorsoAngle();
        const stability = this.calculateStability();
        
        // PASSO 2: Máquina de Estados de Combate (FSM)
        this.updateCombatState();
        
        // Decidir ação baseada no estado
        this.decideAction(centerOfMass, torsoAngle, stability);
        
        // Atualizar energia e stamina
        this.updateEnergy();
        
        // Atualizar estado
        this.updateState(stability);
        
        // Atualizar cooldowns
        this.updateCooldowns();
    }
    
    // PASSO 2: Máquina de Estados de Combate (FSM)
    updateCombatState() {
        const currentTime = Date.now();
        
        // Verificar se está em stagger
        if (this.combat.staggerTime > 0) {
            this.state = 'STAGGERED';
            return;
        }
        
        // Lógica da FSM
        if (!this.combat.target) {
            // Sem alvo -> BALANCING
            this.state = 'BALANCING';
        } else {
            // Calcular distância para o alvo
            const distance = Math.sqrt(
                Math.pow(this.torso.position.x - this.combat.target.torso.position.x, 2) +
                Math.pow(this.torso.position.y - this.combat.target.torso.position.y, 2)
            );
            
            if (distance > 80) {
                // Longe do alvo -> APPROACHING
                this.state = 'APPROACHING';
            } else if (distance <= 80 && this.combat.attackCooldown <= 0) {
                // Perto do alvo e pode atacar -> ATTACKING
                this.state = 'ATTACKING';
                this.startAttack();
            } else {
                // Perto mas em cooldown -> BALANCING
                this.state = 'BALANCING';
            }
        }
    }
    
    // PASSO 4: Sistema de Ataque
    startAttack() {
        if (this.combat.isAttacking) return;
        
        this.combat.isAttacking = true;
        this.combat.attackDuration = 600; // 600ms de duração do ataque
        this.combat.attackCooldown = 1000; // 1 segundo de cooldown
        
        console.log(`🥊 ${this.id} iniciou ataque!`);
        
        // Executar sequência de soco
        this.executePunch();
    }
    
    // PASSO 4: Biblioteca de Movimentos - Soco Simples
    executePunch() {
        // Fase 1: Puxar braço para trás (200ms)
        setTimeout(() => {
            if (this.combat.isAttacking && this.rightArm) {
                this.applyForceToLimb('rightArm', { x: -0.003, y: 0 });
            }
        }, 0);
        
        // Fase 2: Soco para frente (350ms)
        setTimeout(() => {
            if (this.combat.isAttacking && this.rightArm && this.combat.target) {
                const direction = this.combat.target.torso.position.x > this.torso.position.x ? 1 : -1;
                this.applyForceToLimb('rightArm', { x: direction * 0.008, y: 0 });
                
                // Marcar o braço como "atacando" para detecção de colisão
                this.rightArm.isAttacking = true;
                
                // Remover flag após um tempo
                setTimeout(() => {
                    if (this.rightArm) this.rightArm.isAttacking = false;
                }, 200);
            }
        }, 200);
        
        // Finalizar ataque
        setTimeout(() => {
            this.combat.isAttacking = false;
        }, this.combat.attackDuration);
    }
    
    // Atualizar cooldowns
    updateCooldowns() {
        if (this.combat.attackCooldown > 0) {
            this.combat.attackCooldown -= 16; // ~60fps
        }
        if (this.combat.staggerTime > 0) {
            this.combat.staggerTime -= 16;
        }
        if (this.combat.attackDuration > 0) {
            this.combat.attackDuration -= 16;
        }
    }
    
    // PASSO 5: Sistema de Dano
    takeDamage(amount, attacker) {
        this.health -= amount;
        this.combat.staggerTime = 500; // 500ms de stagger
        
        console.log(`💥 ${this.id} recebeu ${amount} de dano! Saúde: ${this.health}`);
        
        if (this.health <= 0) {
            this.health = 0;
            this.isActive = false;
            console.log(`💀 ${this.id} foi derrotado!`);
        }
        
        // Aplicar força de knockback
        if (attacker && this.torso) {
            const direction = this.torso.position.x > attacker.torso.position.x ? 1 : -1;
            this.applyForceToLimb('torso', { x: direction * 0.005, y: -0.002 });
        }
    }
    
    decideAction(centerOfMass, torsoAngle, stability) {
        // Base de suporte
        const supportBase = {
            x: (this.leftLeg.position.x + this.rightLeg.position.x) / 2,
            y: Math.max(this.leftLeg.position.y, this.rightLeg.position.y)
        };
        
        // Calcular desequilíbrio
        const horizontalImbalance = centerOfMass.x - supportBase.x;
        const angleImbalance = torsoAngle;
        
        // Comportamento baseado no estado
        switch (this.state) {
            case 'APPROACHING':
                this.approachTarget(centerOfMass, torsoAngle, stability);
                break;
            case 'ATTACKING':
                // Durante ataque, manter equilíbrio básico
                this.maintainBalance(centerOfMass, torsoAngle, stability);
                break;
            case 'STAGGERED':
                // Em stagger, tentar recuperar equilíbrio
                this.recoverFromStagger(centerOfMass, torsoAngle, stability);
                break;
            default: // BALANCING
                this.maintainBalance(centerOfMass, torsoAngle, stability);
                break;
        }
    }
    
    // PASSO 3: Ação APPROACHING - Aproximar do alvo
    /**
     * Sistema de aproximação com caminhada natural
     */
    approachTarget(centerOfMass, torsoAngle, stability) {
        if (!this.combat.target) return;
        
        // Manter equilíbrio durante movimento
        this.maintainBalance(centerOfMass, torsoAngle, stability);
        
        const targetDistance = Math.abs(this.combat.target.torso.position.x - this.torso.position.x);
        const direction = this.combat.target.torso.position.x > this.torso.position.x ? 1 : -1;
        
        // Parar se muito próximo para atacar
        if (targetDistance < 60) {
            this.combat.target = null;
            this.state = 'ATTACKING';
            return;
        }
        
        // Sistema de caminhada natural
        this.simulateWalking(direction, stability);
        
        // Ajustar velocidade baseada na personalidade
        const speedMultiplier = this.personality.aggression * 0.5 + 0.5;
        this.applyForceToLimb('torso', { 
            x: direction * 0.0015 * speedMultiplier * this.movement.walkSpeed, 
            y: 0 
        });
    }
    
    /**
     * Sistema de combate avançado com ataques variados
     */
    performAttack(centerOfMass, torsoAngle, stability) {
        if (!this.combat.target) {
            this.state = 'BALANCING';
            return;
        }
        
        const distance = Math.abs(this.combat.target.torso.position.x - this.torso.position.x);
        
        // Se muito longe, voltar a se aproximar
        if (distance > 80) {
            this.state = 'APPROACHING';
            return;
        }
        
        // Escolher tipo de ataque baseado na personalidade
        const attackType = this.chooseAttackType();
        const direction = this.combat.target.torso.position.x > this.torso.position.x ? 1 : -1;
        
        // Executar ataque específico
        this.executeAttack(attackType, direction, distance);
        
        // Cooldown baseado na agilidade
        const cooldownTime = Math.max(300, 800 - (this.personality.reflexes * 200));
        
        setTimeout(() => {
            if (this.state === 'ATTACKING') {
                this.state = Math.random() < 0.7 ? 'APPROACHING' : 'BALANCING';
            }
        }, cooldownTime);
    }
    
    /**
     * Escolhe o tipo de ataque baseado na personalidade
     */
    chooseAttackType() {
        const rand = Math.random();
        const aggression = this.personality.aggression;
        
        if (rand < aggression * 0.4) return 'punch';
        if (rand < aggression * 0.7) return 'kick';
        if (rand < aggression * 0.9) return 'combo';
        return 'defensive';
    }
    
    /**
     * Executa diferentes tipos de ataques
     */
    executeAttack(attackType, direction, distance) {
        const attackForce = 0.003 + (this.personality.aggression * 0.002);
        
        switch (attackType) {
            case 'punch':
                this.executePunch(direction, attackForce, distance);
                break;
            case 'kick':
                this.executeKick(direction, attackForce, distance);
                break;
            case 'combo':
                this.executeCombo(direction, attackForce, distance);
                break;
            case 'defensive':
                this.executeDefensiveMove(direction);
                break;
        }
    }
    
    /**
     * Executa um soco
     */
    executePunch(direction, force, distance) {
        const arm = Math.random() < 0.5 ? 'leftArm' : 'rightArm';
        
        // Movimento do braço
        this.applyForceToLimb(arm, { 
            x: direction * force * 1.5, 
            y: -force * 0.3 
        });
        
        // Rotação do torso para mais força
        this.applyForceToLimb('torso', { 
            x: direction * force * 0.5, 
            y: 0 
        });
        
        // Aplicar dano se próximo o suficiente
        if (distance < 55) {
            this.dealDamage(15 + Math.random() * 10);
        }
    }
    
    /**
     * Executa um chute
     */
    executeKick(direction, force, distance) {
        const leg = Math.random() < 0.5 ? 'leftLeg' : 'rightLeg';
        
        // Movimento da perna
        this.applyForceToLimb(leg, { 
            x: direction * force * 2, 
            y: -force * 0.5 
        });
        
        // Equilíbrio com a outra perna
        const otherLeg = leg === 'leftLeg' ? 'rightLeg' : 'leftLeg';
        this.applyForceToLimb(otherLeg, { 
            x: -direction * force * 0.3, 
            y: -force * 0.8 
        });
        
        // Aplicar dano se próximo o suficiente
        if (distance < 60) {
            this.dealDamage(20 + Math.random() * 15);
        }
    }
    
    /**
     * Executa um combo de ataques
     */
    executeCombo(direction, force, distance) {
        // Primeiro ataque - soco
        this.executePunch(direction, force * 0.8, distance);
        
        // Segundo ataque após delay
        setTimeout(() => {
            if (this.state === 'ATTACKING') {
                this.executeKick(direction, force * 1.2, distance);
            }
        }, 200);
    }
    
    /**
     * Movimento defensivo
     */
    executeDefensiveMove(direction) {
        // Recuar ligeiramente
        this.applyForceToLimb('torso', { 
            x: -direction * 0.001, 
            y: 0 
        });
        
        // Posição defensiva com os braços
        this.applyForceToLimb('leftArm', { 
            x: 0, 
            y: -0.0005 
        });
        this.applyForceToLimb('rightArm', { 
            x: 0, 
            y: -0.0005 
        });
    }
    
    /**
     * Aplica dano ao alvo
     */
    dealDamage(damage) {
        if (this.combat.target && this.combat.target.takeDamage) {
            this.combat.target.takeDamage(damage);
            
            // Aplicar força de impacto no alvo
            const direction = this.combat.target.torso.position.x > this.torso.position.x ? 1 : -1;
            this.combat.target.applyForceToLimb('torso', {
                x: direction * 0.002,
                y: -0.001
            });
        }
    }
    
    /**
     * Simula caminhada natural com alternância de pernas
     */
    simulateWalking(direction, stability) {
        this.movement.walkCycle += 0.15;
        
        // Alternância natural das pernas
        const leftPhase = Math.sin(this.movement.walkCycle);
        const rightPhase = Math.sin(this.movement.walkCycle + Math.PI);
        
        // Força de caminhada baseada na estabilidade
        const walkForce = 0.0008 * stability * this.movement.walkSpeed;
        
        // Aplicar forças alternadas nas pernas
        this.applyForceToLimb('leftLeg', {
            x: direction * walkForce * leftPhase * 0.8,
            y: leftPhase > 0 ? -walkForce * 0.3 : 0
        });
        
        this.applyForceToLimb('rightLeg', {
            x: direction * walkForce * rightPhase * 0.8,
            y: rightPhase > 0 ? -walkForce * 0.3 : 0
        });
        
        // Movimento sutil dos braços para equilíbrio
        this.applyForceToLimb('leftArm', {
            x: direction * walkForce * rightPhase * 0.3,
            y: 0
        });
        
        this.applyForceToLimb('rightArm', {
            x: direction * walkForce * leftPhase * 0.3,
            y: 0
        });
    }
    
    /**
     * Sistema avançado de manutenção de equilíbrio
     */
    maintainBalance(centerOfMass, torsoAngle, stability) {
        // Calcular desequilíbrio
        const supportBase = {
            x: (this.leftLeg.position.x + this.rightLeg.position.x) / 2,
            y: Math.max(this.leftLeg.position.y, this.rightLeg.position.y)
        };
        
        const horizontalImbalance = centerOfMass.x - supportBase.x;
        const angleImbalance = torsoAngle;
        
        // Correção de postura baseada na personalidade
        const balanceThreshold = this.controlConfig.balanceThreshold + (this.personality.endurance * 0.1);
        
        // CORREÇÃO DE ÂNGULO DO TORSO
        if (Math.abs(angleImbalance) > balanceThreshold) {
            const correctionStrength = this.personality.endurance * 0.002;
            const torsoCorrection = -angleImbalance * correctionStrength;
            
            this.applyForceToLimb('torso', {
                x: torsoCorrection * 0.001,
                y: -Math.abs(torsoCorrection) * 0.5 // Força para baixo para estabilizar
            });
            
            // Usar braços para equilíbrio
            this.applyForceToLimb('leftArm', {
                x: torsoCorrection * 0.3,
                y: angleImbalance > 0 ? -0.0005 : 0.0005
            });
            this.applyForceToLimb('rightArm', {
                x: -torsoCorrection * 0.3,
                y: angleImbalance > 0 ? 0.0005 : -0.0005
            });
        }
        
        // CORREÇÃO DE EQUILÍBRIO HORIZONTAL
        if (Math.abs(horizontalImbalance) > 10) {
            const legCorrection = -horizontalImbalance * 0.3;
            
            // Aplicar força nas pernas para corrigir posição
            this.applyForceToLimb('leftLeg', {
                x: legCorrection * 0.0005,
                y: 0
            });
            
            this.applyForceToLimb('rightLeg', {
                x: legCorrection * 0.0005,
                y: 0
            });
        }
        
        // Sistema de estabilização das pernas
        this.stabilizeLegs(stability);
        
        // ESTABILIZAÇÃO ATIVA DOS BRAÇOS
        if (stability < this.controlConfig.stabilityTarget) {
            this.applyForceToLimb('leftArm', {
                x: 0,
                y: -0.0002
            });
            
            this.applyForceToLimb('rightArm', {
                x: 0,
                y: -0.0002
            });
        }
    }
    
    /**
     * Estabiliza as pernas para melhor equilíbrio
     */
    stabilizeLegs(stability) {
        const legStabilityForce = 0.0003 * stability;
        
        // Aplicar força para manter pernas estáveis
        if (this.leftLeg.position.y > this.torso.position.y + 40) {
            this.applyForceToLimb('leftLeg', { x: 0, y: -legStabilityForce });
        }
        
        if (this.rightLeg.position.y > this.torso.position.y + 40) {
            this.applyForceToLimb('rightLeg', { x: 0, y: -legStabilityForce });
        }
        
        // Manter pernas alinhadas com o torso
        const leftLegOffset = this.leftLeg.position.x - (this.torso.position.x - 15);
        const rightLegOffset = this.rightLeg.position.x - (this.torso.position.x + 15);
        
        if (Math.abs(leftLegOffset) > 20) {
            this.applyForceToLimb('leftLeg', { x: -leftLegOffset * 0.0001, y: 0 });
        }
        
        if (Math.abs(rightLegOffset) > 20) {
            this.applyForceToLimb('rightLeg', { x: -rightLegOffset * 0.0001, y: 0 });
        }
    }
    
    // Recuperação de stagger
    recoverFromStagger(centerOfMass, torsoAngle, stability) {
        // Durante stagger, aplicar forças de recuperação mais intensas
        this.maintainBalance(centerOfMass, torsoAngle, stability);
        
        // Força adicional para recuperar postura
        this.applyForceToLimb('torso', { x: 0, y: -0.001 });
    }
    
    // Método auxiliar para aplicar força corretiva
    applyCorrectiveForce(horizontalImbalance) {
        const balanceForce = -horizontalImbalance * 0.0001;
        
        // Aplicar força corretiva nas pernas
        this.applyForceToLimb('leftLeg', {
            x: balanceForce,
            y: 0
        });
        
        this.applyForceToLimb('rightLeg', {
            x: balanceForce,
            y: 0
        });
        
        // Ajustar postura do torso
        this.applyForceToLimb('torso', {
                x: balanceForce * 0.5,
                y: 0
            });
        
        // MANTER PERNAS NO CHÃO
        const groundLevel = this.render.options.height - 50;
        
        if (this.leftLeg.position.y < groundLevel - 20) {
            this.applyForceToLimb('leftLeg', {
                x: 0,
                y: 0.002
            });
        }
        
        if (this.rightLeg.position.y < groundLevel - 20) {
            this.applyForceToLimb('rightLeg', {
                x: 0,
                y: 0.002
            });
        }
        
        // ESTABILIZAÇÃO ATIVA DOS BRAÇOS
        if (stability < 0.5) {
            // Usar braços para ajudar no equilíbrio
            const armBalanceForce = horizontalImbalance * 0.00005;
            
            this.applyForceToLimb('leftArm', {
                x: -armBalanceForce,
                y: 0
            });
            
            this.applyForceToLimb('rightArm', {
                x: armBalanceForce,
                y: 0
            });
        }
        
        // RECUPERAÇÃO ATIVA (se caído)
        if (stability < 0.2 && this.energy > 50) {
            this.attemptRecovery();
        }
    }
    
    attemptRecovery() {
        console.log(`🔄 Ragdoll ${this.id} tentando se recuperar...`);
        
        // Força de recuperação no torso
        this.applyForceToLimb('torso', {
            x: 0,
            y: -0.005
        });
        
        // Empurrar com as pernas
        this.applyForceToLimb('leftLeg', {
            x: 0,
            y: -0.003
        });
        
        this.applyForceToLimb('rightLeg', {
            x: 0,
            y: -0.003
        });
        
        // Gastar stamina
        this.stamina -= 10;
    }
    
    /**
     * Sistema de gerenciamento de energia e stamina
     */
    updateEnergy() {
        // Regenerar saúde lentamente quando não em combate
        if (this.health < 100 && this.state === 'BALANCING') {
            this.health += 0.1;
        }
        
        // Regenerar stamina baseado na resistência
        if (this.stamina < 100) {
            const recoveryRate = 0.5 + (this.personality.endurance * 0.3);
            this.stamina += recoveryRate;
        }
        
        // Gastar stamina baseado na atividade
        let staminaDrain = 0;
        
        switch (this.state) {
            case 'APPROACHING':
                staminaDrain = 0.2;
                break;
            case 'ATTACKING':
                staminaDrain = 0.5;
                break;
            case 'STAGGERED':
                staminaDrain = 0.1;
                break;
            default:
                staminaDrain = 0.05; // Drain mínimo para manter-se em pé
        }
        
        // Ajustar drain baseado na estabilidade
        if (this.stability < 0.5) {
            staminaDrain *= 1.5;
        }
        
        this.stamina -= staminaDrain;
        
        // Limitar valores
        this.health = Math.max(0, Math.min(100, this.health));
        this.stamina = Math.max(0, Math.min(100, this.stamina));
        
        // Se stamina muito baixa, reduzir eficiência
        if (this.stamina < 20) {
            this.movement.walkSpeed = Math.max(0.3, this.movement.walkSpeed * 0.95);
        } else {
            this.movement.walkSpeed = Math.min(1.0, this.movement.walkSpeed * 1.01);
        }
    }
    
    updateState(stability) {
        if (stability > this.controlConfig.stabilityTarget) {
            this.state = 'balancing';
        } else if (stability > 0.3) {
            this.state = 'stabilizing';
        } else {
            this.state = 'falling';
        }
    }
    
    // SISTEMA DE DEBUG VISUAL
    renderDebugInfo(ctx) {
        if (!this.debugVisuals.showDebug || !ctx) return;
        
        // Renderizar centro de massa
        if (this.debugVisuals.centerOfMass) {
            const com = this.debugVisuals.centerOfMass;
            ctx.save();
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(com.x, com.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // Texto de debug
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            // Informações do ragdoll com cores
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`${this.id}`, com.x + 10, com.y - 10);
            
            // Saúde (vermelho se baixa)
            ctx.fillStyle = this.health > 30 ? '#00FF00' : '#FF0000';
            ctx.fillText(`❤️ ${this.health.toFixed(0)}`, com.x + 10, com.y + 5);
            
            // Stamina (azul se baixa)
            ctx.fillStyle = this.stamina > 30 ? '#00AAFF' : '#0066AA';
            ctx.fillText(`⚡ ${this.stamina.toFixed(0)}`, com.x + 10, com.y + 20);
            
            // Estado atual
            ctx.fillStyle = '#FFFF00';
            ctx.fillText(`${this.state}`, com.x + 10, com.y + 35);
            
            // Personalidade (apenas para debug)
            if (window.debugMode) {
                ctx.fillStyle = '#CCCCCC';
                ctx.font = '10px Arial';
                ctx.fillText(`Agressão: ${this.personality.aggression.toFixed(1)}`, com.x + 10, com.y + 50);
                ctx.fillText(`Resistência: ${this.personality.endurance.toFixed(1)}`, com.x + 10, com.y + 62);
                ctx.fillText(`Reflexos: ${this.personality.reflexes.toFixed(1)}`, com.x + 10, com.y + 74);
                ctx.font = '12px Arial';
            }
            ctx.restore();
        }
        
        // Renderizar vetores de força
        this.debugVisuals.forceVectors.forEach(vector => {
            ctx.save();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(vector.position.x, vector.position.y);
            ctx.lineTo(
                vector.position.x + vector.force.x,
                vector.position.y + vector.force.y
            );
            ctx.stroke();
            ctx.restore();
        });
    }
    
    // MÉTODOS DE UTILIDADE
    getBodyParts() {
        return this.bodyParts;
    }
    
    getConstraints() {
        return this.constraints;
    }
    
    destroy() {
        console.log(`💀 Destruindo Ragdoll ${this.id}`);
        this.isActive = false;
        
        // Remover do mundo
        Matter.World.remove(this.world, this.bodyParts);
        Matter.World.remove(this.world, this.constraints);
    }
    
    toggleDebug() {
        this.debugVisuals.showDebug = !this.debugVisuals.showDebug;
        console.log(`🔍 Debug visual ${this.debugVisuals.showDebug ? 'ativado' : 'desativado'} para Ragdoll ${this.id}`);
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Ragdoll;
} else {
    window.Ragdoll = Ragdoll;
}