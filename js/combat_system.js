// Sistema Avançado de Combate e Movimento para Ragdolls
// Implementa animações realistas, combate e habilidades especiais

class CombatSystem {
    constructor(physicsSimulator) {
        this.simulator = physicsSimulator;
        this.combatStates = new Map();
        this.animations = new Map();
        this.combos = new Map();
        this.specialAbilities = new Map();
        
        // Configurações de combate
        this.combatConfig = {
            punchDamage: 15,
            kickDamage: 25,
            specialDamage: 40,
            comboMultiplier: 1.5,
            blockReduction: 0.3,
            criticalChance: 0.15,
            criticalMultiplier: 2.0
        };
        
        // Tipos de ataques
        this.attackTypes = {
            JAB: 'jab',
            HOOK: 'hook',
            UPPERCUT: 'uppercut',
            KICK: 'kick',
            FLYING_KICK: 'flying_kick',
            SPECIAL: 'special'
        };
        
        // Estados de movimento
        this.movementStates = {
            IDLE: 'idle',
            WALKING: 'walking',
            RUNNING: 'running',
            JUMPING: 'jumping',
            CROUCHING: 'crouching',
            BLOCKING: 'blocking'
        };
        
        this.initializeCombatSystem();
    }
    
    initializeCombatSystem() {
        console.log('🥊 Sistema de Combate Avançado Inicializado!');
        
        // Configurar eventos de teclado para combate
        this.setupCombatControls();
        
        // Inicializar sistema de animações
        this.initializeAnimationSystem();
        
        // Configurar sistema de combos
        this.initializeComboSystem();
    }
    
    setupCombatControls() {
        document.addEventListener('keydown', (event) => {
            const ragdoll = this.getSelectedRagdoll();
            if (!ragdoll) return;
            
            switch(event.key.toLowerCase()) {
                case 'q': // Soco rápido (Jab)
                    this.performAttack(ragdoll, this.attackTypes.JAB);
                    break;
                case 'w': // Gancho (Hook)
                    this.performAttack(ragdoll, this.attackTypes.HOOK);
                    break;
                case 'e': // Uppercut
                    this.performAttack(ragdoll, this.attackTypes.UPPERCUT);
                    break;
                case 'r': // Chute
                    this.performAttack(ragdoll, this.attackTypes.KICK);
                    break;
                case 't': // Voadora
                    this.performAttack(ragdoll, this.attackTypes.FLYING_KICK);
                    break;
                case 'y': // Habilidade Especial
                    this.performSpecialAbility(ragdoll);
                    break;
                case 'a': // Andar para esquerda
                    this.moveRagdoll(ragdoll, 'left', this.movementStates.WALKING);
                    break;
                case 'd': // Andar para direita
                    this.moveRagdoll(ragdoll, 'right', this.movementStates.WALKING);
                    break;
                case 's': // Agachar
                    this.setMovementState(ragdoll, this.movementStates.CROUCHING);
                    break;
                case ' ': // Pular
                    this.performJump(ragdoll);
                    break;
                case 'shift': // Correr
                    this.toggleRunning(ragdoll);
                    break;
                case 'f': // Bloquear
                    this.performBlock(ragdoll);
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            const ragdoll = this.getSelectedRagdoll();
            if (!ragdoll) return;
            
            switch(event.key.toLowerCase()) {
                case 'a':
                case 'd':
                    this.setMovementState(ragdoll, this.movementStates.IDLE);
                    break;
                case 's':
                    this.setMovementState(ragdoll, this.movementStates.IDLE);
                    break;
                case 'f':
                    this.stopBlocking(ragdoll);
                    break;
            }
        });
    }
    
    initializeAnimationSystem() {
        // Sistema de animações procedurais
        this.animationFrames = {
            [this.attackTypes.JAB]: [
                { duration: 100, armRotation: -45, torsoRotation: 10 },
                { duration: 150, armRotation: 45, torsoRotation: -5 },
                { duration: 100, armRotation: 0, torsoRotation: 0 }
            ],
            [this.attackTypes.HOOK]: [
                { duration: 150, armRotation: -90, torsoRotation: 30 },
                { duration: 200, armRotation: 90, torsoRotation: -15 },
                { duration: 150, armRotation: 0, torsoRotation: 0 }
            ],
            [this.attackTypes.UPPERCUT]: [
                { duration: 200, armRotation: -120, torsoRotation: -20 },
                { duration: 250, armRotation: -30, torsoRotation: 15 },
                { duration: 150, armRotation: 0, torsoRotation: 0 }
            ],
            [this.attackTypes.KICK]: [
                { duration: 150, legRotation: -60, torsoRotation: 15 },
                { duration: 200, legRotation: 60, torsoRotation: -10 },
                { duration: 150, legRotation: 0, torsoRotation: 0 }
            ],
            [this.attackTypes.FLYING_KICK]: [
                { duration: 100, legRotation: -90, torsoRotation: 45, jump: true },
                { duration: 300, legRotation: 90, torsoRotation: -30, airborne: true },
                { duration: 200, legRotation: 0, torsoRotation: 0 }
            ]
        };
    }
    
    initializeComboSystem() {
        // Sistema de combos
        this.comboSequences = {
            'FURY_COMBO': [this.attackTypes.JAB, this.attackTypes.JAB, this.attackTypes.HOOK],
            'POWER_COMBO': [this.attackTypes.UPPERCUT, this.attackTypes.KICK],
            'AERIAL_COMBO': [this.attackTypes.FLYING_KICK, this.attackTypes.SPECIAL],
            'GROUND_COMBO': [this.attackTypes.KICK, this.attackTypes.JAB, this.attackTypes.UPPERCUT]
        };
    }
    
    performAttack(ragdoll, attackType) {
        const combatState = this.getCombatState(ragdoll);
        
        // Verificar se pode atacar
        if (!this.canPerformAttack(ragdoll, combatState)) {
            console.log('❌ Não é possível atacar agora!');
            return;
        }
        
        // Encontrar alvo próximo
        const target = this.findNearestTarget(ragdoll);
        if (!target) {
            console.log('🎯 Nenhum alvo encontrado!');
            this.performAttackAnimation(ragdoll, attackType);
            return;
        }
        
        // Executar ataque
        this.executeAttack(ragdoll, target, attackType);
        
        // Atualizar combo
        this.updateCombo(ragdoll, attackType);
        
        // Aplicar cooldown
        combatState.lastAttack = Date.now();
        combatState.stamina -= this.getAttackStaminaCost(attackType);
        
        console.log(`🥊 ${attackType.toUpperCase()} executado!`);
    }
    
    executeAttack(attacker, target, attackType) {
        const distance = this.getDistance(attacker.torso.position, target.torso.position);
        const attackRange = this.getAttackRange(attackType);
        
        if (distance > attackRange) {
            console.log('📏 Alvo fora de alcance!');
            return;
        }
        
        // Calcular dano
        let damage = this.calculateDamage(attacker, target, attackType);
        
        // Verificar crítico
        if (Math.random() < this.combatConfig.criticalChance) {
            damage *= this.combatConfig.criticalMultiplier;
            console.log('💥 CRÍTICO!');
        }
        
        // Verificar bloqueio
        const targetCombatState = this.getCombatState(target);
        if (targetCombatState.isBlocking) {
            damage *= this.combatConfig.blockReduction;
            console.log('🛡️ Ataque bloqueado!');
        }
        
        // Aplicar dano
        this.applyDamage(target, damage);
        
        // Aplicar força do impacto
        this.applyImpactForce(attacker, target, attackType);
        
        // Executar animação
        this.performAttackAnimation(attacker, attackType);
        
        // Efeitos visuais
        this.createImpactEffect(target.torso.position, damage);
    }
    
    calculateDamage(attacker, target, attackType) {
        const attackerState = this.getCombatState(attacker);
        const baseDamage = this.getBaseDamage(attackType);
        
        // Modificadores
        const strengthModifier = attackerState.strength / 100;
        const comboModifier = attackerState.comboCount > 0 ? this.combatConfig.comboMultiplier : 1;
        const staminaModifier = attackerState.stamina / 100;
        
        return baseDamage * strengthModifier * comboModifier * staminaModifier;
    }
    
    applyImpactForce(attacker, target, attackType) {
        const direction = {
            x: target.torso.position.x - attacker.torso.position.x,
            y: target.torso.position.y - attacker.torso.position.y
        };
        
        // Normalizar direção
        const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
        if (magnitude > 0) {
            direction.x /= magnitude;
            direction.y /= magnitude;
        }
        
        // Calcular força baseada no tipo de ataque
        const forceMultiplier = this.getForceMultiplier(attackType);
        const force = {
            x: direction.x * forceMultiplier,
            y: direction.y * forceMultiplier * 0.5
        };
        
        // Aplicar força ao alvo
        Matter.Body.applyForce(target.torso, target.torso.position, force);
        
        // Aplicar força de recuo ao atacante
        const recoilForce = {
            x: -direction.x * forceMultiplier * 0.3,
            y: -direction.y * forceMultiplier * 0.1
        };
        Matter.Body.applyForce(attacker.torso, attacker.torso.position, recoilForce);
    }
    
    performAttackAnimation(ragdoll, attackType) {
        const animation = this.animationFrames[attackType];
        if (!animation) return;
        
        let frameIndex = 0;
        const animateFrame = () => {
            if (frameIndex >= animation.length) return;
            
            const frame = animation[frameIndex];
            this.applyAnimationFrame(ragdoll, frame);
            
            frameIndex++;
            setTimeout(animateFrame, frame.duration);
        };
        
        animateFrame();
    }
    
    applyAnimationFrame(ragdoll, frame) {
        // Aplicar rotações e movimentos baseados no frame da animação
        if (frame.armRotation !== undefined) {
            const armForce = frame.armRotation * 0.001;
            Matter.Body.applyForce(ragdoll.rightArm, ragdoll.rightArm.position, {
                x: Math.cos(frame.armRotation * Math.PI / 180) * armForce,
                y: Math.sin(frame.armRotation * Math.PI / 180) * armForce
            });
        }
        
        if (frame.legRotation !== undefined) {
            const legForce = frame.legRotation * 0.001;
            Matter.Body.applyForce(ragdoll.rightLeg, ragdoll.rightLeg.position, {
                x: Math.cos(frame.legRotation * Math.PI / 180) * legForce,
                y: Math.sin(frame.legRotation * Math.PI / 180) * legForce
            });
        }
        
        if (frame.torsoRotation !== undefined) {
            const torsoForce = frame.torsoRotation * 0.0005;
            Matter.Body.applyForce(ragdoll.torso, ragdoll.torso.position, {
                x: torsoForce,
                y: 0
            });
        }
        
        if (frame.jump) {
            Matter.Body.applyForce(ragdoll.torso, ragdoll.torso.position, {
                x: 0,
                y: -0.01
            });
        }
    }
    
    performSpecialAbility(ragdoll) {
        const combatState = this.getCombatState(ragdoll);
        
        if (combatState.specialCooldown > Date.now()) {
            console.log('⏰ Habilidade especial em cooldown!');
            return;
        }
        
        if (combatState.stamina < 50) {
            console.log('💨 Stamina insuficiente para habilidade especial!');
            return;
        }
        
        // Executar habilidade especial baseada na personalidade
        const ability = this.getSpecialAbility(ragdoll);
        this.executeSpecialAbility(ragdoll, ability);
        
        // Aplicar cooldown
        combatState.specialCooldown = Date.now() + 5000; // 5 segundos
        combatState.stamina -= 50;
        
        console.log(`✨ Habilidade especial ${ability.name} executada!`);
    }
    
    getSpecialAbility(ragdoll) {
        const ai = this.simulator.ragdollAI.get(ragdoll);
        const personality = ai ? ai.personality : 0.5;
        
        if (personality > 0.8) {
            return {
                name: 'BERSERKER_RAGE',
                effect: 'Aumenta dano e velocidade por 10 segundos',
                duration: 10000
            };
        } else if (personality > 0.6) {
            return {
                name: 'POWER_STRIKE',
                effect: 'Próximo ataque causa dano triplo',
                duration: 0
            };
        } else if (personality > 0.4) {
            return {
                name: 'DEFENSIVE_STANCE',
                effect: 'Reduz dano recebido em 70% por 8 segundos',
                duration: 8000
            };
        } else {
            return {
                name: 'SHADOW_STEP',
                effect: 'Teleporta para trás do inimigo mais próximo',
                duration: 0
            };
        }
    }
    
    executeSpecialAbility(ragdoll, ability) {
        switch (ability.name) {
            case 'BERSERKER_RAGE':
                this.applyBerserkerRage(ragdoll, ability.duration);
                break;
            case 'POWER_STRIKE':
                this.applyPowerStrike(ragdoll);
                break;
            case 'DEFENSIVE_STANCE':
                this.applyDefensiveStance(ragdoll, ability.duration);
                break;
            case 'SHADOW_STEP':
                this.applyShadowStep(ragdoll);
                break;
        }
    }
    
    applyBerserkerRage(ragdoll, duration) {
        const combatState = this.getCombatState(ragdoll);
        combatState.berserkerMode = true;
        combatState.damageMultiplier = 2.0;
        combatState.speedMultiplier = 1.5;
        
        // Efeito visual
        ragdoll.head.render.fillStyle = '#ff0000';
        ragdoll.torso.render.fillStyle = '#cc0000';
        
        setTimeout(() => {
            combatState.berserkerMode = false;
            combatState.damageMultiplier = 1.0;
            combatState.speedMultiplier = 1.0;
            
            // Restaurar cor original
            const ai = this.simulator.ragdollAI.get(ragdoll);
            ragdoll.head.render.fillStyle = ai ? ai.color : '#feca57';
            ragdoll.torso.render.fillStyle = '#4a90e2';
        }, duration);
    }
    
    applyShadowStep(ragdoll) {
        const target = this.findNearestTarget(ragdoll);
        if (!target) return;
        
        // Calcular posição atrás do alvo
        const direction = {
            x: ragdoll.torso.position.x - target.torso.position.x,
            y: ragdoll.torso.position.y - target.torso.position.y
        };
        
        const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
        if (magnitude > 0) {
            direction.x /= magnitude;
            direction.y /= magnitude;
        }
        
        const teleportDistance = 60;
        const newPosition = {
            x: target.torso.position.x + direction.x * teleportDistance,
            y: target.torso.position.y + direction.y * teleportDistance
        };
        
        // Teleportar ragdoll
        Matter.Body.setPosition(ragdoll.torso, newPosition);
        Matter.Body.setPosition(ragdoll.head, { x: newPosition.x, y: newPosition.y - 35 });
        Matter.Body.setPosition(ragdoll.leftArm, { x: newPosition.x - 20, y: newPosition.y - 10 });
        Matter.Body.setPosition(ragdoll.rightArm, { x: newPosition.x + 20, y: newPosition.y - 10 });
        Matter.Body.setPosition(ragdoll.leftLeg, { x: newPosition.x - 10, y: newPosition.y + 35 });
        Matter.Body.setPosition(ragdoll.rightLeg, { x: newPosition.x + 10, y: newPosition.y + 35 });
        
        // Efeito visual de teleporte
        this.createTeleportEffect(ragdoll.torso.position);
    }
    
    moveRagdoll(ragdoll, direction, movementType) {
        const combatState = this.getCombatState(ragdoll);
        const speedMultiplier = combatState.speedMultiplier || 1.0;
        
        let force = 0.002;
        if (movementType === this.movementStates.RUNNING) {
            force *= 2;
            combatState.stamina -= 0.5;
        }
        
        force *= speedMultiplier;
        
        const directionMultiplier = direction === 'left' ? -1 : 1;
        
        // Aplicar força de movimento
        Matter.Body.applyForce(ragdoll.torso, ragdoll.torso.position, {
            x: force * directionMultiplier,
            y: 0
        });
        
        // Animação de caminhada/corrida
        this.performWalkingAnimation(ragdoll, movementType);
        
        this.setMovementState(ragdoll, movementType);
    }
    
    performJump(ragdoll) {
        const combatState = this.getCombatState(ragdoll);
        
        if (combatState.isAirborne || combatState.stamina < 20) {
            return;
        }
        
        const jumpForce = 0.015;
        Matter.Body.applyForce(ragdoll.torso, ragdoll.torso.position, {
            x: 0,
            y: -jumpForce
        });
        
        combatState.isAirborne = true;
        combatState.stamina -= 20;
        
        // Detectar quando toca o chão novamente
        setTimeout(() => {
            combatState.isAirborne = false;
        }, 1000);
        
        console.log('🦘 Pulo executado!');
    }
    
    performBlock(ragdoll) {
        const combatState = this.getCombatState(ragdoll);
        combatState.isBlocking = true;
        
        // Posição defensiva
        Matter.Body.applyForce(ragdoll.leftArm, ragdoll.leftArm.position, {
            x: 0.001,
            y: -0.001
        });
        Matter.Body.applyForce(ragdoll.rightArm, ragdoll.rightArm.position, {
            x: -0.001,
            y: -0.001
        });
        
        console.log('🛡️ Bloqueio ativado!');
    }
    
    stopBlocking(ragdoll) {
        const combatState = this.getCombatState(ragdoll);
        combatState.isBlocking = false;
        console.log('🛡️ Bloqueio desativado!');
    }
    
    // Funções auxiliares
    getCombatState(ragdoll) {
        if (!this.combatStates.has(ragdoll)) {
            this.combatStates.set(ragdoll, {
                health: 100,
                stamina: 100,
                strength: 100,
                lastAttack: 0,
                comboCount: 0,
                comboTimer: 0,
                isBlocking: false,
                isAirborne: false,
                movementState: this.movementStates.IDLE,
                specialCooldown: 0,
                damageMultiplier: 1.0,
                speedMultiplier: 1.0,
                berserkerMode: false
            });
        }
        return this.combatStates.get(ragdoll);
    }
    
    getSelectedRagdoll() {
        // Por enquanto, retorna o primeiro ragdoll
        return this.simulator.ragdolls[0] || null;
    }
    
    findNearestTarget(ragdoll) {
        let nearestTarget = null;
        let nearestDistance = Infinity;
        
        this.simulator.ragdolls.forEach(target => {
            if (target === ragdoll) return;
            
            const distance = this.getDistance(ragdoll.torso.position, target.torso.position);
            if (distance < nearestDistance && distance < 150) {
                nearestDistance = distance;
                nearestTarget = target;
            }
        });
        
        return nearestTarget;
    }
    
    getDistance(pos1, pos2) {
        return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
    }
    
    canPerformAttack(ragdoll, combatState) {
        const now = Date.now();
        const attackCooldown = 300; // 300ms entre ataques
        
        return (now - combatState.lastAttack) > attackCooldown && 
               combatState.stamina > 10 && 
               !combatState.isBlocking;
    }
    
    getAttackRange(attackType) {
        switch (attackType) {
            case this.attackTypes.JAB:
            case this.attackTypes.HOOK:
                return 50;
            case this.attackTypes.UPPERCUT:
                return 40;
            case this.attackTypes.KICK:
                return 60;
            case this.attackTypes.FLYING_KICK:
                return 80;
            default:
                return 50;
        }
    }
    
    getBaseDamage(attackType) {
        switch (attackType) {
            case this.attackTypes.JAB:
                return this.combatConfig.punchDamage * 0.7;
            case this.attackTypes.HOOK:
                return this.combatConfig.punchDamage;
            case this.attackTypes.UPPERCUT:
                return this.combatConfig.punchDamage * 1.3;
            case this.attackTypes.KICK:
                return this.combatConfig.kickDamage;
            case this.attackTypes.FLYING_KICK:
                return this.combatConfig.kickDamage * 1.5;
            case this.attackTypes.SPECIAL:
                return this.combatConfig.specialDamage;
            default:
                return 10;
        }
    }
    
    getForceMultiplier(attackType) {
        switch (attackType) {
            case this.attackTypes.JAB:
                return 0.005;
            case this.attackTypes.HOOK:
                return 0.008;
            case this.attackTypes.UPPERCUT:
                return 0.010;
            case this.attackTypes.KICK:
                return 0.012;
            case this.attackTypes.FLYING_KICK:
                return 0.020;
            default:
                return 0.005;
        }
    }
    
    getAttackStaminaCost(attackType) {
        switch (attackType) {
            case this.attackTypes.JAB:
                return 5;
            case this.attackTypes.HOOK:
                return 8;
            case this.attackTypes.UPPERCUT:
                return 12;
            case this.attackTypes.KICK:
                return 10;
            case this.attackTypes.FLYING_KICK:
                return 20;
            default:
                return 5;
        }
    }
    
    applyDamage(ragdoll, damage) {
        const combatState = this.getCombatState(ragdoll);
        combatState.health -= damage;
        
        // Efeito visual de dano
        const originalColor = ragdoll.head.render.fillStyle;
        ragdoll.head.render.fillStyle = '#ff6b6b';
        
        setTimeout(() => {
            ragdoll.head.render.fillStyle = originalColor;
        }, 200);
        
        if (combatState.health <= 0) {
            this.knockOutRagdoll(ragdoll);
        }
        
        console.log(`💥 Dano aplicado: ${damage.toFixed(1)} | Vida restante: ${combatState.health.toFixed(1)}`);
    }
    
    knockOutRagdoll(ragdoll) {
        const combatState = this.getCombatState(ragdoll);
        combatState.health = 0;
        
        // Efeito visual de nocaute
        [ragdoll.head, ragdoll.torso, ragdoll.leftArm, ragdoll.rightArm, ragdoll.leftLeg, ragdoll.rightLeg].forEach(part => {
            if (part) {
                part.render.fillStyle = '#666666';
            }
        });
        
        console.log('💀 Ragdoll nocauteado!');
    }
    
    createImpactEffect(position, damage) {
        // Criar efeito visual de impacto
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = position.x + 'px';
        effect.style.top = position.y + 'px';
        effect.style.color = damage > 20 ? '#ff0000' : '#ffaa00';
        effect.style.fontSize = '20px';
        effect.style.fontWeight = 'bold';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1000';
        effect.textContent = `-${damage.toFixed(0)}`;
        
        document.body.appendChild(effect);
        
        // Animar e remover
        let opacity = 1;
        let y = 0;
        const animate = () => {
            opacity -= 0.05;
            y -= 2;
            effect.style.opacity = opacity;
            effect.style.transform = `translateY(${y}px)`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(effect);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    createTeleportEffect(position) {
        console.log(`✨ Efeito de teleporte em (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
    }
    
    setMovementState(ragdoll, state) {
        const combatState = this.getCombatState(ragdoll);
        combatState.movementState = state;
    }
    
    performWalkingAnimation(ragdoll, movementType) {
        // Animação simples de caminhada
        const force = movementType === this.movementStates.RUNNING ? 0.002 : 0.001;
        
        // Movimento alternado das pernas
        const time = Date.now();
        const leftLegOffset = Math.sin(time * 0.01) * force;
        const rightLegOffset = Math.sin(time * 0.01 + Math.PI) * force;
        
        Matter.Body.applyForce(ragdoll.leftLeg, ragdoll.leftLeg.position, {
            x: leftLegOffset,
            y: 0
        });
        
        Matter.Body.applyForce(ragdoll.rightLeg, ragdoll.rightLeg.position, {
            x: rightLegOffset,
            y: 0
        });
    }
    
    updateCombo(ragdoll, attackType) {
        const combatState = this.getCombatState(ragdoll);
        const now = Date.now();
        
        // Reset combo se muito tempo passou
        if (now - combatState.comboTimer > 2000) {
            combatState.comboCount = 0;
        }
        
        combatState.comboCount++;
        combatState.comboTimer = now;
        
        if (combatState.comboCount > 1) {
            console.log(`🔥 COMBO x${combatState.comboCount}!`);
        }
    }
    
    toggleRunning(ragdoll) {
        const combatState = this.getCombatState(ragdoll);
        const isRunning = combatState.movementState === this.movementStates.RUNNING;
        
        if (isRunning) {
            this.setMovementState(ragdoll, this.movementStates.WALKING);
        } else {
            this.setMovementState(ragdoll, this.movementStates.RUNNING);
        }
    }
    
    // Sistema de regeneração
    startRegenerationSystem() {
        setInterval(() => {
            this.combatStates.forEach((state, ragdoll) => {
                // Regenerar stamina
                if (state.stamina < 100) {
                    state.stamina = Math.min(100, state.stamina + 1);
                }
                
                // Regenerar vida lentamente
                if (state.health > 0 && state.health < 100) {
                    state.health = Math.min(100, state.health + 0.1);
                }
            });
        }, 100);
    }
    
    // Interface de status
    displayCombatStatus(ragdoll) {
        const combatState = this.getCombatState(ragdoll);
        
        console.log('=== STATUS DE COMBATE ===');
        console.log(`❤️ Vida: ${combatState.health.toFixed(1)}/100`);
        console.log(`💨 Stamina: ${combatState.stamina.toFixed(1)}/100`);
        console.log(`💪 Força: ${combatState.strength}/100`);
        console.log(`🏃 Estado: ${combatState.movementState}`);
        console.log(`🔥 Combo: x${combatState.comboCount}`);
        console.log(`🛡️ Bloqueando: ${combatState.isBlocking ? 'Sim' : 'Não'}`);
        console.log(`🦘 No ar: ${combatState.isAirborne ? 'Sim' : 'Não'}`);
        console.log('========================');
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatSystem;
} else {
    window.CombatSystem = CombatSystem;
}